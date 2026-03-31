"use client";

import { useEffect, useMemo, useState } from "react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import type { CustomerListItem } from "@/lib/customers";

export function CustomerListPreview() {
  const [companyFilter, setCompanyFilter] = useState("");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading customer profiles from Supabase...");

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        const response = await fetch("/api/customers", { cache: "no-store" });
        const result = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setStatusMessage(result.error ?? "Unable to load customer profiles.");
          return;
        }

        setCustomers(result.customers ?? []);
        setStatusMessage("Customer preview is now reading from Supabase.");
      } catch {
        if (isMounted) {
          setStatusMessage("Unable to reach the customer API.");
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => matchesCompanyFilter(customer.company, companyFilter)),
    [companyFilter, customers],
  );

  return (
    <section className="app-panel rounded-[30px] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Recent Profiles
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Customer list preview
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p>
        </div>
        <div className="w-full max-w-[260px]">
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]">
            <option value="">Filter by company</option>
            {companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filteredCustomers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"
          >
            <div className="grid gap-4 lg:grid-cols-[0.14fr_0.2fr_0.22fr_0.18fr_0.18fr_0.08fr] lg:items-center">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                #{customer.customerCode}
              </p>
              <p className="text-sm text-[var(--color-ink)]">{customer.fullName}</p>
              <p className="text-sm text-[var(--color-muted)]">{customer.company}</p>
              <p className="text-sm text-[var(--color-muted)]">{customer.phoneNumber}</p>
              <p className="text-sm text-[var(--color-muted)]">{customer.area}</p>
              <span className="rounded-full bg-[var(--color-panel-strong)] px-3 py-1 text-xs font-medium text-[var(--color-accent-strong)]">
                {customer.status}
              </span>
            </div>
          </article>
        ))}

        {!filteredCustomers.length ? (
          <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-white px-5 py-8 text-center text-sm text-[var(--color-muted)]">
            No customers available for the selected filter yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
