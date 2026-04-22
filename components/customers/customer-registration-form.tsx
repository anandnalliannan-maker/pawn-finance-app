"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Camera, LoaderCircle, Paperclip, Plus } from "lucide-react";

import {
  type CreateCustomerPayload,
  type CustomerIdProofDocuments,
  type CustomerIdProofKey,
  customerIdProofTypes,
  GLOBAL_CUSTOMER_MASTER_LABEL,
  GLOBAL_CUSTOMER_UPLOAD_SCOPE,
  normalizeAadhaar,
  normalizePhoneNumber,
} from "@/lib/customers";
import {
  MAX_CUSTOMER_PHOTO_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
  uploadSelectedFiles,
} from "@/lib/uploads";

type FormState = {
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

type SaveSummary = {
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  area: string;
  aadhaarNumber: string;
  customerMaster: string;
};

type CustomerRegistrationFormProps = {
  selectedCompany: string;
};

type AreaResponse = {
  items?: string[];
};

const initialState: FormState = {
  fullName: "",
  phoneNumber: "",
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

const phonePlaceholder = "+91 90000 00000";
const aadhaarPlaceholder = "XXXX XXXX XXXX";

async function parseApiError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.error === "string") {
      return payload.error;
    }
  } catch {}

  return response.statusText || "Something went wrong.";
}

function formatPhoneForDisplay(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function formatAadhaarForDisplay(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function mergeDocumentPath(existing: CustomerIdProofDocuments, key: CustomerIdProofKey, path: string) {
  return {
    ...existing,
    [key]: [path],
  };
}

export function CustomerRegistrationForm({ selectedCompany }: CustomerRegistrationFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoUploadPath, setPhotoUploadPath] = useState<string | null>(null);
  const [documentUploads, setDocumentUploads] = useState<CustomerIdProofDocuments>({});
  const [documentNames, setDocumentNames] = useState<Partial<Record<CustomerIdProofKey, string>>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadingProofKey, setUploadingProofKey] = useState<CustomerIdProofKey | null>(null);
  const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [areasLoaded, setAreasLoaded] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [areaSaveError, setAreaSaveError] = useState<string | null>(null);
  const [isSavingArea, setIsSavingArea] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedPhone = normalizePhoneNumber(form.phoneNumber);
  const normalizedAadhaar = normalizeAadhaar(form.aadhaarNumber);

  const filteredAreas = useMemo(() => {
    const query = form.area.trim().toLowerCase();
    if (!query) {
      return areaOptions.slice(0, 8);
    }

    return areaOptions.filter((area) => area.toLowerCase().includes(query)).slice(0, 8);
  }, [areaOptions, form.area]);

  async function ensureAreaOptionsLoaded() {
    if (areasLoaded || isLoadingAreas) {
      return;
    }

    setIsLoadingAreas(true);
    try {
      const response = await fetch("/api/areas", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as AreaResponse;
      setAreaOptions((payload.items ?? []).sort((left, right) => left.localeCompare(right)));
      setAreasLoaded(true);
    } catch (error) {
      setAreaSaveError(error instanceof Error ? error.message : "Unable to load saved areas.");
    } finally {
      setIsLoadingAreas(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (sameAsCurrentAddress && key === "currentAddress") {
        next.permanentAddress = String(value);
      }

      return next;
    });
  }

  async function handlePhotoSelection(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_CUSTOMER_PHOTO_SIZE_BYTES) {
      setErrorMessage("Customer photo must be 1 MB or smaller.");
      return;
    }

    setErrorMessage(null);
    setIsUploadingPhoto(true);

    try {
      const uploads = await uploadSelectedFiles("customer-photo", GLOBAL_CUSTOMER_UPLOAD_SCOPE, [file]);
      const uploadedPath = uploads[0];
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoFileName(file.name);
      setPhotoUploadPath(uploadedPath);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload customer photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleDocumentSelection(key: CustomerIdProofKey, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setErrorMessage(`${customerIdProofTypes.find((item) => item.key === key)?.label ?? "Document"} must be 500 KB or smaller.`);
      return;
    }

    setErrorMessage(null);
    setUploadingProofKey(key);

    try {
      const uploads = await uploadSelectedFiles("customer-document", GLOBAL_CUSTOMER_UPLOAD_SCOPE, [file]);
      const uploadedPath = uploads[0];
      setDocumentUploads((current) => mergeDocumentPath(current, key, uploadedPath));
      setDocumentNames((current) => ({ ...current, [key]: file.name }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload the document.");
    } finally {
      setUploadingProofKey(null);
    }
  }

  async function handleAreaSave() {
    const name = newAreaName.trim();
    if (!name) {
      setAreaSaveError("Area name is required.");
      return;
    }

    setIsSavingArea(true);
    setAreaSaveError(null);

    try {
      const response = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const payload = (await response.json()) as { item?: { name?: string } };
      const savedName = payload.item?.name?.trim() || name;
      setAreaOptions((current) => Array.from(new Set([...current, savedName])).sort((left, right) => left.localeCompare(right)));
      setForm((current) => ({ ...current, area: savedName }));
      setNewAreaName("");
      setIsAddingArea(false);
      setAreasLoaded(true);
    } catch (error) {
      setAreaSaveError(error instanceof Error ? error.message : "Unable to save the area.");
    } finally {
      setIsSavingArea(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaveSummary(null);

    if (normalizedPhone.length !== 10) {
      setErrorMessage("Enter a valid 10-digit phone number.");
      return;
    }

    if (normalizedAadhaar && normalizedAadhaar.length !== 12) {
      setErrorMessage("Aadhaar number must be 12 digits.");
      return;
    }

    setIsSaving(true);

    const payload: CreateCustomerPayload = {
      companyName: selectedCompany,
      fullName: form.fullName.trim(),
      phoneNumber: normalizedPhone,
      alternatePhoneNumber: normalizePhoneNumber(form.alternatePhoneNumber),
      currentAddress: form.currentAddress.trim(),
      permanentAddress: form.permanentAddress.trim(),
      aadhaarNumber: normalizedAadhaar,
      guardianLabel: form.guardianLabel,
      guardianName: form.guardianName.trim(),
      area: form.area.trim(),
      referenceName: form.referenceName.trim(),
      remarks: form.remarks.trim(),
      profilePhotoPath: photoUploadPath ?? undefined,
      documentPaths: documentUploads,
    };

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const result = (await response.json()) as {
        customer?: {
          customerCode?: string;
          name?: string;
          phone?: string;
          area?: string;
          aadhaar?: string;
        };
      };

      setSuccessMessage("Customer saved successfully.");
      setSaveSummary({
        customerCode: result.customer?.customerCode ?? "Auto",
        fullName: result.customer?.name ?? form.fullName.trim(),
        phoneNumber: result.customer?.phone ?? normalizedPhone,
        area: result.customer?.area ?? form.area.trim(),
        aadhaarNumber: result.customer?.aadhaar ?? normalizedAadhaar,
        customerMaster: GLOBAL_CUSTOMER_MASTER_LABEL,
      });
      setForm(initialState);
      setSameAsCurrentAddress(false);
      setPhotoPreview(null);
      setPhotoFileName(null);
      setPhotoUploadPath(null);
      setDocumentUploads({});
      setDocumentNames({});
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save customer.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-stone-200 bg-white/95 p-8 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)] sm:p-10">
        <div className="flex flex-col gap-6 border-b border-stone-200 pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Customer Registration</p>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">New Customer</h1>
              <p className="mt-2 text-sm text-stone-500">Shared customer master for all companies.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 self-start lg:flex-row-reverse">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 text-amber-700 transition hover:border-amber-500 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="Customer preview" width={128} height={128} className="h-full w-full object-cover" unoptimized />
              ) : isUploadingPhoto ? (
                <LoaderCircle className="h-7 w-7 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-xs font-medium uppercase tracking-[0.25em]">
                  <Camera className="h-8 w-8" />
                  <span>Add photo</span>
                </div>
              )}
            </button>

            <div className="space-y-3 rounded-[1.5rem] bg-stone-50 px-5 py-4 text-sm text-stone-600">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Customer Master</p>
              <p className="text-lg font-semibold text-stone-900">{GLOBAL_CUSTOMER_MASTER_LABEL}</p>
              <p className="text-xs text-stone-500">Photo is optional. Upload one clear profile image.</p>
              {photoFileName ? <p className="text-xs font-medium text-stone-700">{photoFileName}</p> : null}
            </div>
          </div>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => void handlePhotoSelection(event.target.files)}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Customer Name" required>
            <input
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Enter full name"
              className={inputClassName}
            />
          </FormField>

          <FormField label="Phone Number" required>
            <div className={inputClassName}>
              <span className="text-stone-900">+91</span>
              <input
                value={formatPhoneForDisplay(form.phoneNumber)}
                onChange={(event) => updateField("phoneNumber", event.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                placeholder={phonePlaceholder}
                className="w-full bg-transparent text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>
          </FormField>

          <FormField label="Alternate Phone">
            <input
              value={formatPhoneForDisplay(form.alternatePhoneNumber)}
              onChange={(event) => updateField("alternatePhoneNumber", event.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder={phonePlaceholder}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Aadhaar Number">
            <input
              value={formatAadhaarForDisplay(form.aadhaarNumber)}
              onChange={(event) => updateField("aadhaarNumber", event.target.value.replace(/\D/g, "").slice(0, 12))}
              inputMode="numeric"
              placeholder={aadhaarPlaceholder}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Guardian Label">
            <select value={form.guardianLabel} onChange={(event) => updateField("guardianLabel", event.target.value)} className={inputClassName}>
              <option value="s/o">s/o</option>
              <option value="d/o">d/o</option>
              <option value="w/o">w/o</option>
            </select>
          </FormField>

          <FormField label="Guardian Name">
            <input
              value={form.guardianName}
              onChange={(event) => updateField("guardianName", event.target.value)}
              placeholder="Enter guardian name"
              className={inputClassName}
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <FormField label="Current Address">
            <textarea
              value={form.currentAddress}
              onChange={(event) => updateField("currentAddress", event.target.value)}
              placeholder="Door number, street, locality"
              rows={4}
              className={`${inputClassName} min-h-[140px] resize-none py-5`}
            />
          </FormField>

          <FormField label="Permanent Address">
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={sameAsCurrentAddress}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSameAsCurrentAddress(checked);
                    setForm((current) => ({
                      ...current,
                      permanentAddress: checked ? current.currentAddress : current.permanentAddress,
                    }));
                  }}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Permanent address same as current address</span>
              </label>
              <textarea
                value={form.permanentAddress}
                onChange={(event) => updateField("permanentAddress", event.target.value)}
                placeholder="Permanent address"
                rows={4}
                disabled={sameAsCurrentAddress}
                className={`${inputClassName} min-h-[140px] resize-none py-5 disabled:cursor-not-allowed disabled:bg-stone-100`}
              />
            </div>
          </FormField>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Area">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    value={form.area}
                    onFocus={() => void ensureAreaOptionsLoaded()}
                    onChange={(event) => updateField("area", event.target.value)}
                    placeholder={isLoadingAreas ? "Loading saved areas..." : "Type area name"}
                    autoComplete="off"
                    name="customer-area-lookup"
                    data-form-type="other"
                    className={inputClassName}
                  />
                  {filteredAreas.length > 0 ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]">
                      {filteredAreas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => updateField("area", area)}
                          className="block w-full border-b border-stone-100 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-amber-50 last:border-b-0"
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAreaSaveError(null);
                    setNewAreaName(form.area.trim());
                    setIsAddingArea((current) => !current);
                  }}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Area
                </button>
              </div>

              {isAddingArea ? (
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newAreaName}
                      onChange={(event) => setNewAreaName(event.target.value)}
                      placeholder="Enter area name"
                      autoComplete="off"
                      name="new-area-name"
                      data-form-type="other"
                      className={inputClassName}
                    />
                    <button
                      type="button"
                      onClick={() => void handleAreaSave()}
                      disabled={isSavingArea}
                      className="inline-flex h-14 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingArea ? "Saving..." : "Save"}
                    </button>
                  </div>
                  {areaSaveError ? <p className="mt-3 text-sm text-rose-600">{areaSaveError}</p> : null}
                </div>
              ) : null}
            </div>
          </FormField>

          <FormField label="Reference">
            <input
              value={form.referenceName}
              onChange={(event) => updateField("referenceName", event.target.value)}
              placeholder="Reference person or note"
              className={inputClassName}
            />
          </FormField>
        </div>

        <FormField label="Remarks">
          <textarea
            value={form.remarks}
            onChange={(event) => updateField("remarks", event.target.value)}
            placeholder="Important observations, collateral notes, or customer-specific remarks"
            rows={4}
            className={`${inputClassName} min-h-[140px] resize-none py-5`}
          />
        </FormField>

        <div className="space-y-4 rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-6">
          <div>
            <p className="text-sm font-semibold text-stone-900">ID Proof Attachments</p>
            <p className="mt-1 text-xs text-stone-500">Upload one file for each proof type. Each file can be up to 500 KB.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customerIdProofTypes.map((proofType) => {
              const currentName = documentNames[proofType.key];
              const isUploading = uploadingProofKey === proofType.key;

              return (
                <label
                  key={proofType.key}
                  className="flex cursor-pointer flex-col gap-3 rounded-[1.5rem] border border-dashed border-stone-300 bg-white px-4 py-4 text-sm text-stone-600 transition hover:border-amber-400 hover:bg-amber-50"
                >
                  <span className="font-semibold text-stone-800">{proofType.label}</span>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-stone-400">
                    <Paperclip className="h-4 w-4" />
                    {isUploading ? "Uploading" : currentName ? "Replace file" : "Select file"}
                  </span>
                  <span className="min-h-[1.25rem] text-xs text-stone-500">{currentName ?? "No file uploaded"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(event) => void handleDocumentSelection(proofType.key, event.target.files)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {errorMessage ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        {successMessage ? <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

        <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Customer ID will be generated automatically on save.</p>
          <button
            type="submit"
            disabled={isSaving || isUploadingPhoto || uploadingProofKey !== null}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-7 py-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving customer..." : "Save customer"}
          </button>
        </div>
      </form>

      {saveSummary ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4">
          <div className="w-full max-w-xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.55)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Customer Saved</p>
            <h2 className="mt-3 text-3xl font-semibold text-stone-900">Registration summary</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SummaryItem label="Customer ID" value={saveSummary.customerCode} />
              <SummaryItem label="Customer Master" value={saveSummary.customerMaster} />
              <SummaryItem label="Name" value={saveSummary.fullName} />
              <SummaryItem label="Phone" value={`+91 ${formatPhoneForDisplay(saveSummary.phoneNumber)}`} />
              <SummaryItem label="Area" value={saveSummary.area || "Not provided"} />
              <SummaryItem
                label="Aadhaar"
                value={saveSummary.aadhaarNumber ? formatAadhaarForDisplay(saveSummary.aadhaarNumber) : "Not provided"}
              />
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setSaveSummary(null)}
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Close summary
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type FormFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function FormField({ label, required = false, children }: FormFieldProps) {
  return (
    <label className="space-y-3 text-sm font-medium text-stone-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-amber-700">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
}

const inputClassName =
  "flex h-14 w-full items-center gap-3 rounded-[1.4rem] border border-stone-200 bg-white px-5 text-lg text-stone-900 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
