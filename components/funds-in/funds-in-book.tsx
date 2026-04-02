"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDownCircle, Paperclip, Save } from "lucide-react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import { formatIsoDate, isDateWithinRange } from "@/lib/date-utils";
import type { CreateFundsInPayload, FundSourceType, FundsInRecord } from "@/lib/funds-in";
import { fundSourceTypes } from "@/lib/funds-in";
import { sourceAccounts } from "@/lib/source-accounts";

function formatCurrency(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

export function FundsInBook({ selectedCompany }: { selectedCompany: string }) {
  const [entries, setEntries] = useState<FundsInRecord[]>([]);
  const [entryDate, setEntryDate] = useState(formatIsoDate(new Date()));
  const [sourceType, setSourceType] = useState<FundSourceType>("Owner Capital");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [amount, setAmount] = useState("1000000");
  const [account, setAccount] = useState<(typeof sourceAccounts)[number]>("Cash in Hand");
  const [remarks, setRemarks] = useState("");
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<FundSourceType | "All">("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading funds in entries from Supabase...");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEntries() {
      try {
        const response = await fetch("/api/funds-in", { cache: "no-store" });
        const result = await response.json();
        if (!isMounted) {
          return;
        }
        if (!response.ok) {
          setStatusMessage(result.error ?? "Unable to load funds in entries.");
          return;
        }
        setEntries((result.entries ?? []) as FundsInRecord[]);
        setStatusMessage("Funds In is posting real incoming entries to the ledger and cash book.");
      } catch {
        if (isMounted) {
          setStatusMessage("Unable to reach the funds in endpoint.");
        }
      }
    }

    loadEntries();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesCompanyFilter(entry.company, companyFilter) &&
          (sourceFilter === "All" ? true : entry.sourceType === sourceFilter) &&
          isDateWithinRange(entry.date, fromDate, toDate),
      ),
    [entries, companyFilter, sourceFilter, fromDate, toDate],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("Saving funds in entry to Supabase...");

    const payload: CreateFundsInPayload = {
      companyName: selectedCompany,
      entryDate,
      sourceType,
      receivedFrom,
      amount: Number(amount) || 0,
      account,
      remarks,
      supportingDocuments,
    };

    try {
      const response = await fetch("/api/funds-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save funds in entry.");
        return;
      }

      if (result.entry) {
        setEntries((current) => [result.entry as FundsInRecord, ...current]);
      }
      setStatusMessage(result.message ?? "Funds in recorded successfully.");
      setSourceType("Owner Capital");
      setReceivedFrom("");
      setAmount("1000000");
      setAccount("Cash in Hand");
      setRemarks("");
      setSupportingDocuments([]);
    } catch {
      setStatusMessage("Unable to reach the funds in save endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Funds In</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Bring money into the business</h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <ArrowDownCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Date</span><input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2 xl:col-span-3"><span className="text-sm font-medium text-[var(--color-muted)]">Company</span><input value={selectedCompany} readOnly className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Funds source type</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value as FundSourceType)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">{fundSourceTypes.map((item) => (<option key={item} value={item}>{item}</option>))}</select></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Received from</span><input value={receivedFrom} onChange={(event) => setReceivedFrom(event.target.value)} placeholder="Owner / partner / bank / branch name" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Amount</span><input value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Destination account</span><select value={account} onChange={(event) => setAccount(event.target.value as (typeof sourceAccounts)[number])} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">{sourceAccounts.map((item) => (<option key={item} value={item}>{item}</option>))}</select></label>
          <label className="block space-y-2 xl:col-span-4"><span className="text-sm font-medium text-[var(--color-muted)]">Remarks</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} placeholder="Why this money was introduced into the business" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </div>

        <section className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-white p-5"><div className="flex items-center gap-3 text-[var(--color-ink)]"><Paperclip className="h-4 w-4 text-[var(--color-accent)]" /><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Supporting Documents</p></div><input type="file" multiple onChange={(event) => setSupportingDocuments(Array.from(event.target.files ?? []).map((file) => file.name))} className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]" />{supportingDocuments.length ? <p className="mt-3 text-sm text-[var(--color-muted)]">{supportingDocuments.join(", ")}</p> : null}</section>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3 text-sm text-[var(--color-muted)]"><AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" /><p className="max-w-3xl leading-7">{statusMessage}</p></div><button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Funds In"}</button></div>
      </form>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Company filter</span><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]"><option value="">Filter by company</option>{companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}</select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{(["All", ...fundSourceTypes] as const).map((item) => (<button key={item} type="button" onClick={() => setSourceFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${sourceFilter === item ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]"}`}>{item}</button>))}</div>
        <div className="mt-6 grid gap-3">{filteredEntries.map((entry) => (<article key={entry.id} className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"><div className="grid gap-3 lg:grid-cols-[0.12fr_0.18fr_0.18fr_0.16fr_0.12fr_0.12fr_0.12fr] lg:items-center"><Cell label="Date" value={entry.date} /><Cell label="Company" value={entry.company} /><Cell label="Source type" value={entry.sourceType} /><Cell label="Received from" value={entry.receivedFrom} /><Cell label="Account" value={entry.account} /><Cell label="Amount" value={formatCurrency(entry.amount)} /><Cell label="Remarks" value={entry.remarks || "-"} /></div></article>))}</div>
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p><p className="text-sm text-[var(--color-muted)]">{value}</p></div>;
}
