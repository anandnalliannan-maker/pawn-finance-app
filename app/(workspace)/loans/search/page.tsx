"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import { isDateWithinRange } from "@/lib/date-utils";
import { getOutstandingLoanAmount, type LoanRecord } from "@/lib/loans";

const loanGridClass = "lg:grid-cols-[minmax(180px,1.25fr)_minmax(220px,1.55fr)_minmax(130px,0.95fr)_minmax(150px,1fr)_minmax(140px,0.95fr)_minmax(150px,0.95fr)_minmax(120px,0.8fr)]";

export default function SearchLoanPage() {
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [customerIdFilter, setCustomerIdFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showJewelOnly, setShowJewelOnly] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading loans from Supabase...");

  useEffect(() => {
    let isMounted = true;

    async function loadLoans() {
      try {
        const response = await fetch("/api/loans", { cache: "no-store" });
        const result = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setStatusMessage(result.error ?? "Unable to load loans.");
          return;
        }

        setLoans((result.loans ?? []) as LoanRecord[]);
        setStatusMessage("Search is reading live loan data from Supabase.");
      } catch {
        if (isMounted) {
          setStatusMessage("Unable to reach the loan API.");
        }
      }
    }

    loadLoans();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLoans = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    const normalizedPhone = phoneFilter.replace(/\s+/g, "").trim();
    const normalizedCustomerId = customerIdFilter.trim().toLowerCase();
    const normalizedArea = areaFilter.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchesCompany = matchesCompanyFilter(loan.company, companyFilter);
      const matchesName = normalizedName ? loan.customerName.toLowerCase().includes(normalizedName) : true;
      const matchesPhone = normalizedPhone ? loan.phoneNumber.replace(/\s+/g, "").includes(normalizedPhone) : true;
      const matchesCustomerId = normalizedCustomerId ? loan.customerCode.toLowerCase().includes(normalizedCustomerId) : true;
      const matchesArea = normalizedArea ? loan.area.toLowerCase().includes(normalizedArea) : true;
      const matchesActive = showActiveOnly ? loan.status === "Active" : true;
      const matchesJewel = showJewelOnly ? loan.loanType === "Jewel Loan" : true;
      const matchesDateRange = isDateWithinRange(loan.loanDate, fromDate, toDate);

      return matchesCompany && matchesName && matchesPhone && matchesCustomerId && matchesArea && matchesActive && matchesJewel && matchesDateRange;
    });
  }, [areaFilter, companyFilter, customerIdFilter, fromDate, loans, nameFilter, phoneFilter, showActiveOnly, showJewelOnly, toDate]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Search Loan
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_1fr_0.9fr_0.9fr_1fr]">
          <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} placeholder="Customer name" />
          <FilterInput label="Phone no." value={phoneFilter} onChange={setPhoneFilter} placeholder="Phone number" />
          <FilterInput label="Customer ID" value={customerIdFilter} onChange={setCustomerIdFilter} placeholder="Customer ID" />
          <FilterInput label="Area" value={areaFilter} onChange={setAreaFilter} placeholder="Area" />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Company</span>
            <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]">
              <option value="">All companies</option>
              {companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_auto_auto] xl:items-end">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <button type="button" onClick={() => setShowActiveOnly((current) => !current)} className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${showActiveOnly ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>Active loans</button>
          <button type="button" onClick={() => setShowJewelOnly((current) => !current)} className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${showJewelOnly ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>Jewel loans</button>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1200px] gap-3">
            <div className={`hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:items-center ${loanGridClass}`}>
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
                <div className={`grid gap-3 lg:items-center ${loanGridClass}`}>
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

            {!filteredLoans.length ? <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-white px-5 py-8 text-center text-sm text-[var(--color-muted)]">No loans matched the current filters.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Cell({ label, value, subValue, strong = false }: { label: string; value: string; subValue?: string; strong?: boolean }) {
  return <div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p><p className={strong ? "text-sm font-semibold leading-7 text-[var(--color-ink)]" : "text-sm leading-7 text-[var(--color-muted)]"}>{value}</p>{subValue ? <p className="mt-1 text-xs text-[var(--color-muted)]">{subValue}</p> : null}</div>;
}

function FilterInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]" /></label>;
}
