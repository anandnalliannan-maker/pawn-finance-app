"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Camera, Paperclip, Save, X } from "lucide-react";

import type { CreateCustomerPayload } from "@/lib/customers";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_CUSTOMER_PHOTO_SIZE_BYTES,
  uploadSelectedFiles,
} from "@/lib/uploads";

type CustomerSummary = {
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  company: string;
  area: string;
  aadhaarNumber: string;
};

type CustomerFormState = {
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
  currentAddress: string;
  permanentAddress: string;
  aadhaarNumber: string;
  guardianLabel: string;
  guardianName: string;
  area: string;
  referenceName: string;
  remarks: string;
};

const initialState: CustomerFormState = {
  fullName: "",
  phoneNumber: "+91 ",
  alternatePhoneNumber: "",
  currentAddress: "",
  permanentAddress: "",
  aadhaarNumber: "",
  guardianLabel: "s/o",
  guardianName: "",
  area: "",
  referenceName: "",
  remarks: "",
};

type FieldProps = {
  label: string;
  name: keyof CustomerFormState;
  value: string;
  onChange: (name: keyof CustomerFormState, value: string) => void;
  placeholder?: string;
  textarea?: boolean;
};

function FormField({ label, name, value, onChange, placeholder, textarea = false }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
        />
      )}
    </label>
  );
}

function formatBytesLabel(value: number) {
  return `${Math.round(value / 1024)} KB`;
}

export function CustomerRegistrationForm({ selectedCompany }: { selectedCompany: string }) {
  const [formState, setFormState] = useState(initialState);
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Customer registration now supports photo and document attachments.",
  );

  const documentNames = useMemo(() => documentFiles.map((file) => file.name).join(", "), [documentFiles]);

  function handleChange(name: keyof CustomerFormState, value: string) {
    setFormState((current) => {
      const nextState = {
        ...current,
        [name]: value,
      };

      if (name === "currentAddress" && sameAsCurrentAddress) {
        nextState.permanentAddress = value;
      }

      return nextState;
    });
  }

  function handleAddressToggle(checked: boolean) {
    setSameAsCurrentAddress(checked);
    setFormState((current) => ({
      ...current,
      permanentAddress: checked ? current.currentAddress : current.permanentAddress,
    }));
  }

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Customer photo must be an image file.");
      return;
    }

    if (file.size > MAX_CUSTOMER_PHOTO_SIZE_BYTES) {
      setStatusMessage(`Customer photo must be ${formatBytesLabel(MAX_CUSTOMER_PHOTO_SIZE_BYTES)} or smaller.`);
      return;
    }

    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setStatusMessage("Customer photo selected.");
  }

  function handleDocumentChange(files: File[]) {
    const invalidFile = files.find((file) => file.size > MAX_DOCUMENT_SIZE_BYTES);
    if (invalidFile) {
      setStatusMessage(`Each ID proof must be ${formatBytesLabel(MAX_DOCUMENT_SIZE_BYTES)} or smaller.`);
      return;
    }

    setDocumentFiles(files);
    setStatusMessage(files.length ? "ID proof documents selected." : "Customer registration now supports photo and document attachments.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("Saving customer to Supabase...");

    try {
      const [profilePhotoPath, documentPaths] = await Promise.all([
        photoFile ? uploadSelectedFiles("customer-photo", selectedCompany, [photoFile]).then((paths) => paths[0] ?? "") : Promise.resolve(""),
        documentFiles.length ? uploadSelectedFiles("customer-document", selectedCompany, documentFiles) : Promise.resolve([] as string[]),
      ]);

      const payload: CreateCustomerPayload = {
        companyName: selectedCompany,
        fullName: formState.fullName,
        phoneNumber: formState.phoneNumber,
        alternatePhoneNumber: formState.alternatePhoneNumber,
        currentAddress: formState.currentAddress,
        permanentAddress: formState.permanentAddress,
        aadhaarNumber: formState.aadhaarNumber,
        guardianLabel: formState.guardianLabel,
        guardianName: formState.guardianName,
        area: formState.area,
        referenceName: formState.referenceName,
        remarks: formState.remarks,
        profilePhotoPath: profilePhotoPath || undefined,
        documentPaths,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save customer.");
        return;
      }

      if (result.customer) {
        setSummary(result.customer as CustomerSummary);
      }
      setFormState(initialState);
      setSameAsCurrentAddress(false);
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      setDocumentFiles([]);
      setStatusMessage(result.message ?? "Customer saved successfully.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to reach the customer save endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="app-panel rounded-[30px] p-6 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Customer Registration
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
            New customer
          </h2>
        </div>

        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[var(--color-panel-strong)] px-4 py-3 text-sm text-[var(--color-muted)]">
            Customer ID: Auto
          </div>
          <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--color-border)] bg-white text-[var(--color-accent)] transition hover:border-[var(--color-accent)] sm:h-28 sm:w-28">
            {photoPreviewUrl ? (
              <Image src={photoPreviewUrl} alt="Customer preview" fill sizes="112px" className="object-cover" unoptimized />
            ) : (
              <Camera className="h-8 w-8 transition group-hover:scale-105" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handlePhotoChange(event.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Company</span>
            <input value={selectedCompany} readOnly className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]" />
          </label>
          <FormField label="Customer Name" name="fullName" value={formState.fullName} onChange={handleChange} placeholder="Enter full name" />
          <FormField label="Phone Number" name="phoneNumber" value={formState.phoneNumber} onChange={handleChange} placeholder="+91 98765 43210" />
          <FormField label="Alternate Phone" name="alternatePhoneNumber" value={formState.alternatePhoneNumber} onChange={handleChange} placeholder="+91 90000 00000" />
          <FormField label="Aadhaar Number" name="aadhaarNumber" value={formState.aadhaarNumber} onChange={handleChange} placeholder="XXXX XXXX XXXX" />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Guardian Label</span>
            <select value={formState.guardianLabel} onChange={(event) => handleChange("guardianLabel", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">
              <option value="s/o">s/o</option>
              <option value="d/o">d/o</option>
              <option value="w/o">w/o</option>
            </select>
          </label>
          <FormField label="Guardian Name" name="guardianName" value={formState.guardianName} onChange={handleChange} placeholder="Enter guardian name" />
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <FormField label="Current Address" name="currentAddress" value={formState.currentAddress} onChange={handleChange} placeholder="Door no, street, locality" textarea />

          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={sameAsCurrentAddress} onChange={(event) => handleAddressToggle(event.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)]" />
              Permanent address same as current address
            </label>

            <FormField label="Permanent Address" name="permanentAddress" value={formState.permanentAddress} onChange={handleChange} placeholder="Permanent address" textarea />
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <FormField label="Area" name="area" value={formState.area} onChange={handleChange} placeholder="Area / locality" />
          <FormField label="Reference" name="referenceName" value={formState.referenceName} onChange={handleChange} placeholder="Reference contact" />
          <FormField label="Remarks" name="remarks" value={formState.remarks} onChange={handleChange} placeholder="Internal remarks" textarea />
        </section>

        <section className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
          <div className="flex items-center gap-3 text-[var(--color-ink)]">
            <Paperclip className="h-4 w-4 text-[var(--color-accent)]" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">ID Proof Attachment</p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(event) => handleDocumentChange(Array.from(event.target.files ?? []))}
            className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-sm text-[var(--color-muted)]"
          />
          <p className="mt-3 text-xs text-[var(--color-muted)]">Each file must be 500 KB or smaller.</p>
          {documentNames ? <p className="mt-3 text-sm text-[var(--color-muted)]">{documentNames}</p> : null}
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-[var(--color-border)] pt-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)]">{statusMessage}</p>

        <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Customer  F2"}
        </button>
      </div>
      </form>

      {summary ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4"><div className="w-full max-w-xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Customer Saved</p><h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{summary.fullName}</h2><p className="mt-2 text-sm text-[var(--color-muted)]">This is a quick confirmation summary for staff reference.</p></div><button type="button" onClick={() => setSummary(null)} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]" aria-label="Close customer summary"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><SummaryCard label="Customer ID" value={summary.customerCode} /><SummaryCard label="Phone" value={summary.phoneNumber} /><SummaryCard label="Company" value={summary.company} /><SummaryCard label="Area" value={summary.area} /><SummaryCard label="Aadhaar" value={summary.aadhaarNumber} className="sm:col-span-2" /></div><div className="mt-6 flex justify-end"><button type="button" onClick={() => setSummary(null)} className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]">Close</button></div></div></div> : null}
    </>
  );
}



function SummaryCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 ${className}`}><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{value}</p></div>;
}

