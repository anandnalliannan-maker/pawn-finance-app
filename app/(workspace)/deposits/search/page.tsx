"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { isDateWithinRange } from "@/lib/date-utils";
import { ALL_COMPANIES, matchesCompanyScope } from "@/lib/companies";
import { getOutstandingDepositAmount, previewDeposits } from "@/lib/deposits";

export default function SearchDepositPage() {
  const searchParams = useSearchParams();
  const selectedCompany = searchParams.get("company") ?? ALL_COMPANIES;
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredDeposits = useMemo(() => {
    return previewDeposits.filter((deposit) => {
      const matchesCompany = matchesCompanyScope(deposit.company, selectedCompany);
      const matchesQuery = query
        ? [deposit.depositorName, deposit.phoneNumber, deposit.depositorCode, deposit.company]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesActive = showActiveOnly ? deposit.status === "Active" : true;
      const matchesDateRange = isDateWithinRange(deposit.depositDate, fromDate, toDate);

      return matchesCompany && matchesQuery && matchesActive && matchesDateRange;
    });
  }, [query, selectedCompany, showActiveOnly, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Search Deposit</p>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by depositer name, phone number, depositer ID, or company" className="w-full bg-transparent outline-none" /></div>
          <button type="button" onClick={() => setShowActiveOnly((current) => !current)} className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${showActiveOnly ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>Active deposits</button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="grid gap-3">
          <div className="hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:grid-cols-[0.16fr_0.14fr_0.2fr_0.18fr_0.14fr_0.08fr_0.1fr] lg:items-center">
            <span>Name</span><span>Date</span><span>Company</span><span>Phone no.</span><span>Deposit amount</span><span>Interest %</span><span>Status</span>
          </div>
          {filteredDeposits.map((deposit) => (
            <Link key={deposit.id} href={`/deposits/${deposit.id}?company=${encodeURIComponent(deposit.company)}`} className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]">
              <div className="grid gap-3 lg:grid-cols-[0.16fr_0.14fr_0.2fr_0.18fr_0.14fr_0.08fr_0.1fr] lg:items-center">
                <Cell label="Name" value={deposit.depositorName} subValue={deposit.depositorCode} strong />
                <Cell label="Date" value={deposit.depositDate} />
                <Cell label="Company" value={deposit.company} />
                <Cell label="Phone no." value={deposit.phoneNumber} />
                <Cell label="Deposit amount" value={`Rs ${getOutstandingDepositAmount(deposit).toFixed(2)}`} />
                <Cell label="Interest %" value={`${deposit.interestPercent.toFixed(2)}%`} />
                <div><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Status</p><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${deposit.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-800"}`}>{deposit.status}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Cell({ label, value, subValue, strong = false }: { label: string; value: string; subValue?: string; strong?: boolean }) {
  return <div><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p><p className={strong ? "text-sm font-semibold text-[var(--color-ink)]" : "text-sm text-[var(--color-muted)]"}>{value}</p>{subValue ? <p className="mt-1 text-xs text-[var(--color-muted)]">{subValue}</p> : null}</div>;
}
