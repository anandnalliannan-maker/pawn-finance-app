"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardPenLine, RotateCcw, Search } from "lucide-react";

import {
  formatAdjustmentDelta,
  type PaymentAdjustmentRecord,
  type PaymentAdjustmentType,
} from "@/lib/adjustments";
import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import { isDateWithinRange } from "@/lib/date-utils";

export function PaymentAdjustmentsBook() {
  const [adjustments, setAdjustments] = useState<PaymentAdjustmentRecord[]>([]);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<PaymentAdjustmentType | "All">("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading adjustments from Supabase...");

  useEffect(() => {
    let isMounted = true;

    async function loadAdjustments() {
      try {
        const response = await fetch("/api/adjustments", { cache: "no-store" });
        const result = await response.json();
        if (!isMounted) return;
        if (!response.ok) {
          setStatusMessage(result.error ?? "Unable to load payment corrections.");
          return;
        }
        setAdjustments((result.adjustments ?? []) as PaymentAdjustmentRecord[]);
        setStatusMessage("Adjustments are reading from Supabase.");
      } catch {
        if (isMounted) setStatusMessage("Unable to reach the adjustments API.");
      }
    }

    loadAdjustments();
    return () => { isMounted = false; };
  }, []);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adjustment) => {
      const matchesQuery = query
        ? [adjustment.loanAccountNumber, adjustment.customerName, adjustment.reason, adjustment.acknowledgedBy]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesCompany = matchesCompanyFilter(adjustment.company, companyFilter);
      const matchesType = typeFilter === "All" ? true : adjustment.correctionType === typeFilter;
      const matchesDate = isDateWithinRange(adjustment.createdAt, fromDate, toDate);
      return matchesQuery && matchesCompany && matchesType && matchesDate;
    });
  }, [adjustments, companyFilter, fromDate, query, toDate, typeFilter]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Adjustments</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Payment corrections and reversals</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]"><RotateCcw className="h-6 w-6" /></div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(260px,1fr)_240px_220px] xl:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by loan, customer, reason, or staff name" className="w-full bg-transparent outline-none" /></div>
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent)]"><option value="">Filter by company</option>{companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}</select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as PaymentAdjustmentType | "All")} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent)]"><option value="All">All types</option><option value="Full Reversal">Full reversal</option><option value="Partial Adjustment">Partial adjustment</option></select>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1360px] gap-3">
            <div className="hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:grid-cols-[minmax(150px,0.9fr)_minmax(220px,1.2fr)_minmax(190px,1.2fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_minmax(140px,0.8fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)] lg:items-center"><span>Date</span><span>Loan / Customer</span><span>Reason</span><span>Type</span><span>Principal delta</span><span>Interest delta</span><span>Status</span><span>Staff</span></div>
            {filteredAdjustments.map((adjustment) => <article key={adjustment.id} className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"><div className="grid gap-3 lg:grid-cols-[minmax(150px,0.9fr)_minmax(220px,1.2fr)_minmax(190px,1.2fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)] lg:items-center"><Cell label="Date" value={adjustment.createdAt} subValue={adjustment.company} /><Cell label="Loan / Customer" value={adjustment.loanAccountNumber} subValue={adjustment.customerName} strong /><Cell label="Reason" value={adjustment.reason} /><Cell label="Type" value={adjustment.correctionType} /><Cell label="Principal delta" value={formatAdjustmentDelta(adjustment.principalAdjustment)} /><Cell label="Interest delta" value={formatAdjustmentDelta(adjustment.interestAdjustment)} /><div><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Status</p><span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-amber-900">{adjustment.status}</span></div><Cell label="Staff" value={adjustment.acknowledgedBy} /></div></article>)}
          </div>
        </div>
        {!filteredAdjustments.length ? <div className="mt-6 rounded-[24px] border border-dashed border-[var(--color-border)] bg-white px-5 py-8 text-center text-sm text-[var(--color-muted)]">No payment corrections found for the selected filters.</div> : null}
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8"><div className="flex items-center gap-3 text-[var(--color-accent)]"><ClipboardPenLine className="h-5 w-5" /><p className="text-sm font-semibold uppercase tracking-[0.18em]">Control Note</p></div><p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--color-muted)]">Original payments are preserved. Any correction should be posted as a linked reversal or adjustment entry with reason and staff acknowledgement, so audit review can always trace the exact change path.</p></section>
    </div>
  );
}

function Cell({ label, value, subValue, strong = false }: { label: string; value: string; subValue?: string; strong?: boolean }) {
  return <div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p><p className={strong ? "text-sm font-semibold leading-7 text-[var(--color-ink)]" : "text-sm leading-7 text-[var(--color-muted)]"}>{value}</p>{subValue ? <p className="mt-1 text-xs text-[var(--color-muted)]">{subValue}</p> : null}</div>;
}
