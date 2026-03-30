"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { getOutstandingDepositAmount, previewDeposits } from "@/lib/deposits";

export default function SearchDepositPage() {
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredDeposits = useMemo(() => {
    return previewDeposits.filter((deposit) => {
      const matchesQuery = query
        ? [deposit.depositorName, deposit.phoneNumber, deposit.depositorCode]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesActive = showActiveOnly ? deposit.status === "Active" : true;

      return matchesQuery && matchesActive;
    });
  }, [query, showActiveOnly]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Search Deposit
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by depositer name, phone number, or depositer ID"
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
            Active deposits
          </button>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="grid gap-3">
          <div className="hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:grid-cols-[0.24fr_0.2fr_0.18fr_0.18fr_0.2fr] lg:items-center">
            <span>Name</span>
            <span>Phone no.</span>
            <span>Deposit amount</span>
            <span>Interest %</span>
            <span>Status</span>
          </div>

          {filteredDeposits.map((deposit) => (
            <Link
              key={deposit.id}
              href={`/deposits/${deposit.id}?company=${encodeURIComponent(deposit.company)}`}
              className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
            >
              <div className="grid gap-3 lg:grid-cols-[0.24fr_0.2fr_0.18fr_0.18fr_0.2fr] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Name</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{deposit.depositorName}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{deposit.depositorCode}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Phone no.</p>
                  <p className="text-sm text-[var(--color-muted)]">{deposit.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Deposit amount</p>
                  <p className="text-sm text-[var(--color-muted)]">Rs {getOutstandingDepositAmount(deposit).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Interest %</p>
                  <p className="text-sm text-[var(--color-muted)]">{deposit.interestPercent.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">Status</p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${
                      deposit.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-800"
                    }`}
                  >
                    {deposit.status}
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
