"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import { isDateWithinRange } from "@/lib/date-utils";
import { getOutstandingLoanAmount, previewLoans } from "@/lib/loans";

export default function SearchLoanPage() {
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showJewelOnly, setShowJewelOnly] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredLoans = useMemo(() => {
    return previewLoans.filter((loan) => {
      const matchesCompany = matchesCompanyFilter(loan.company, companyFilter);
      const matchesQuery = query
        ? [loan.accountNumber, loan.customerName, loan.phoneNumber, loan.loanType, loan.company]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesActive = showActiveOnly ? loan.status === "Active" : true;
      const matchesJewel = showJewelOnly ? loan.loanType === "Jewel Loan" : true;
      const matchesDateRange = isDateWithinRange(loan.loanDate, fromDate, toDate);

      return matchesCompany && matchesQuery && matchesActive && matchesJewel && matchesDateRange;
    });
  }, [query, companyFilter, showActiveOnly, showJewelOnly, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Search Loan
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_260px_auto_auto] xl:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, phone number, loan type, account number, or company" className="w-full bg-transparent outline-none" />
          </div>
          <label className="block space-y-2 xl:space-y-0">
            <span className="sr-only">Company filter</span>
            <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent)]">
              <option value="">Filter by company</option>
              {companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setShowActiveOnly((current) => !current)} className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${showActiveOnly ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>Active loans</button>
          <button type="button" onClick={() => setShowJewelOnly((current) => !current)} className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${showJewelOnly ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>Jewel loans</button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="grid gap-3">
          <div className="hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:grid-cols-[0.18fr_0.18fr_0.14fr_0.14fr_0.14fr_0.12fr_0.1fr] lg:items-center">
            <span>Name</span>
            <span>Company</span>
            <span>Date</span>
            <span>Phone no.</span>
            <span>Loan type</span>
            <span>Loan amount</span>
            <span>Status</span>
          </div>

          {filteredLoans.map((loan) => (
            <Link key={loan.accountNumber} href={`/loans/${loan.id}?company=${encodeURIComponent(loan.company)}`} className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]">
              <div className="grid gap-3 lg:grid-cols-[0.18fr_0.18fr_0.14fr_0.14fr_0.14fr_0.12fr_0.1fr] lg:items-center">
                <Cell label="Name" value={loan.customerName} subValue={loan.accountNumber} strong />
                <Cell label="Company" value={loan.company} />
                <Cell label="Date" value={loan.loanDate} />
                <Cell label="Phone no." value={loan.phoneNumber} />
                <Cell label="Loan type" value={loan.loanType} />
                <Cell label="Loan amount" value={`Rs ${getOutstandingLoanAmount(loan).toFixed(2)}`} />
                <div><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Status</p><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${loan.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-800"}`}>{loan.status}</span></div>
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
