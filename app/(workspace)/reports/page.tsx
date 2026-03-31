"use client";

import { useEffect, useMemo, useState } from "react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import { previewDeposits } from "@/lib/deposits";
import type { LoanRecord } from "@/lib/loans";

export default function ReportsPage() {
  const [companyFilter, setCompanyFilter] = useState("");
  const [loans, setLoans] = useState<LoanRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadLoans() {
      try {
        const response = await fetch("/api/loans", { cache: "no-store" });
        const result = await response.json();

        if (isMounted && response.ok) {
          setLoans((result.loans ?? []) as LoanRecord[]);
        }
      } catch {
        // Reports can render with deposits even if loan summary load fails.
      }
    }

    loadLoans();

    return () => {
      isMounted = false;
    };
  }, []);

  const scopedLoans = useMemo(
    () => loans.filter((loan) => matchesCompanyFilter(loan.company, companyFilter)),
    [companyFilter, loans],
  );
  const scopedDeposits = useMemo(
    () => previewDeposits.filter((deposit) => matchesCompanyFilter(deposit.company, companyFilter)),
    [companyFilter],
  );
  const activeLoans = scopedLoans.filter((loan) => loan.status === "Active").length;
  const activeDeposits = scopedDeposits.filter((deposit) => deposit.status === "Active").length;

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[28px] p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Reports
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
              Reporting workspace reserved
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
              Reports now default to showing all records. Use the in-page company filter whenever you want to narrow the figures to one branch.
            </p>
          </div>
          <div className="w-full max-w-[260px]">
            <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]">
              <option value="">Filter by company</option>
              {companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard label="Company filter" value={companyFilter || "Showing all company data"} />
        <ReportCard label="Loans in view" value={String(scopedLoans.length)} />
        <ReportCard label="Deposits in view" value={String(scopedDeposits.length)} />
        <ReportCard label="Active loans" value={String(activeLoans)} />
        <ReportCard label="Active deposits" value={String(activeDeposits)} />
        <ReportCard label="Next step" value="Dashboards and exports" />
      </section>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="app-panel rounded-[24px] p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{value}</p>
    </article>
  );
}
