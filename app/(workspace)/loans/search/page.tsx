"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { getOutstandingLoanAmount, previewLoans } from "@/lib/loans";

export default function SearchLoanPage() {
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showJewelOnly, setShowJewelOnly] = useState(false);

  const filteredLoans = useMemo(() => {
    return previewLoans.filter((loan) => {
      const matchesQuery = query
        ? [loan.accountNumber, loan.customerName, loan.phoneNumber, loan.loanType]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesActive = showActiveOnly ? loan.status === "Active" : true;
      const matchesJewel = showJewelOnly ? loan.loanType === "Jewel Loan" : true;

      return matchesQuery && matchesActive && matchesJewel;
    });
  }, [query, showActiveOnly, showJewelOnly]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Search Loan
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, phone number, loan type, or account number"
              className="w-full bg-transparent outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowActiveOnly((current) => !current)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              showActiveOnly
                ? "bg-[var(--color-sidebar)] text-white"
                : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
            }`}
          >
            Active loans
          </button>

          <button
            type="button"
            onClick={() => setShowJewelOnly((current) => !current)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              showJewelOnly
                ? "bg-[var(--color-sidebar)] text-white"
                : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
            }`}
          >
            Jewel loans
          </button>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="grid gap-3">
          <div className="hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:grid-cols-[0.24fr_0.22fr_0.18fr_0.18fr_0.18fr] lg:items-center">
            <span>Name</span>
            <span>Phone no.</span>
            <span>Loan type</span>
            <span>Loan amount</span>
            <span>Status</span>
          </div>

          {filteredLoans.map((loan) => (
            <Link
              key={loan.accountNumber}
              href={`/loans/${loan.id}?company=${encodeURIComponent(loan.company)}`}
              className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
            >
              <div className="grid gap-3 lg:grid-cols-[0.24fr_0.22fr_0.18fr_0.18fr_0.18fr] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Name</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{loan.customerName}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{loan.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Phone no.</p>
                  <p className="text-sm text-[var(--color-muted)]">{loan.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Loan type</p>
                  <p className="text-sm text-[var(--color-muted)]">{loan.loanType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Loan amount</p>
                  <p className="text-sm text-[var(--color-muted)]">Rs {getOutstandingLoanAmount(loan).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Status</p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${
                      loan.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-800"
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}