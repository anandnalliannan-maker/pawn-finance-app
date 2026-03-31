"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";

import { ledgerEntries, type LedgerCategory } from "@/lib/ledger";

const ledgerCategories: Array<LedgerCategory | "All"> = [
  "All",
  "Incoming Payment",
  "Outgoing Loan",
  "Deposit Received",
  "Tea",
  "Snacks",
  "Fuel",
  "Salary",
  "Miscellaneous",
];

function formatCurrency(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

export function LedgerBook({ selectedCompany }: { selectedCompany: string }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LedgerCategory | "All">("All");
  const [selectedDirection, setSelectedDirection] = useState<"All" | "Incoming" | "Outgoing">("All");

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      const matchesCompany = entry.company === selectedCompany;
      const matchesQuery = query
        ? [entry.description, entry.reference, entry.category]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesCategory = selectedCategory === "All" ? true : entry.category === selectedCategory;
      const matchesDirection = selectedDirection === "All" ? true : entry.direction === selectedDirection;

      return matchesCompany && matchesQuery && matchesCategory && matchesDirection;
    });
  }, [query, selectedCategory, selectedCompany, selectedDirection]);

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Ledger Book
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              Full transaction register
            </h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <Filter className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by description, reference, or category"
              className="w-full bg-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ledgerCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  selectedCategory === category
                    ? "bg-[var(--color-sidebar)] text-white"
                    : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["All", "Incoming", "Outgoing"] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => setSelectedDirection(direction)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  selectedDirection === direction
                    ? "bg-[var(--color-accent)] text-white"
                    : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]"
                }`}
              >
                {direction}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="grid gap-3">
          <div className="hidden rounded-[24px] bg-[var(--color-panel-strong)] px-5 py-4 text-sm font-semibold text-[var(--color-ink)] lg:grid lg:grid-cols-[0.12fr_0.28fr_0.18fr_0.12fr_0.15fr_0.15fr] lg:items-center">
            <span>Date</span>
            <span>Description</span>
            <span>Category</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Reference</span>
          </div>

          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"
            >
              <div className="grid gap-3 lg:grid-cols-[0.12fr_0.28fr_0.18fr_0.12fr_0.15fr_0.15fr] lg:items-center">
                <Cell label="Date" value={entry.date} />
                <Cell label="Description" value={entry.description} />
                <Cell label="Category" value={entry.category} />
                <Cell label="Type" value={entry.direction} />
                <Cell label="Amount" value={formatCurrency(entry.amount)} />
                <Cell label="Reference" value={entry.reference} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p>
      <p className="text-sm text-[var(--color-muted)]">{value}</p>
    </div>
  );
}
