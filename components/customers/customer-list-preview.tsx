"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import type { CustomerListItem } from "@/lib/customers";

export function CustomerListPreview() {
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading customer profiles from Supabase...");

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        const response = await fetch("/api/customers", { cache: "no-store" });
        const result = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          setStatusMessage(result.error ?? "Unable to load customer profiles.");
          return;
        }

        setCustomers((result.customers ?? []) as CustomerListItem[]);
        setStatusMessage("Customer search is connected to Supabase.");
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

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!matchesCompanyFilter(customer.company, companyFilter)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        customer.customerCode,
        customer.fullName,
        customer.phoneNumber,
        customer.aadhaarNumber ?? "",
        customer.area,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [companyFilter, customers, normalizedQuery]);

  return (
    <section className="app-panel rounded-[30px] p-6 sm:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Search Customer
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">Find and review customer records</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p>
        </div>
        <div className="grid w-full gap-3 xl:max-w-[760px] xl:grid-cols-[1.2fr_0.8fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, phone, customer ID, Aadhaar, or area"
              className="w-full bg-transparent outline-none"
            />
          </label>
          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]"
          >
            <option value="">All companies</option>
            {companyOptions.map((company) => (
              <option key={company.code} value={company.name}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[0.14fr_0.2fr_0.19fr_0.18fr_0.12fr_0.09fr_0.08fr] gap-4 rounded-t-[24px] bg-[var(--color-panel-strong)] px-6 py-4 text-sm font-semibold text-[var(--color-ink)]">
            <span>Customer ID</span>
            <span>Name</span>
            <span>Company</span>
            <span>Phone no.</span>
            <span>Area</span>
            <span>Aadhaar</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {filteredCustomers.length ? filteredCustomers.map((customer) => (
              <article key={customer.id} className="grid grid-cols-[0.14fr_0.2fr_0.19fr_0.18fr_0.12fr_0.09fr_0.08fr] gap-4 px-6 py-4 text-sm text-[var(--color-muted)]">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{customer.customerCode}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{customer.fullName}</p>
                </div>
                <p>{customer.company}</p>
                <p>{customer.phoneNumber}</p>
                <p>{customer.area}</p>
                <p>{customer.aadhaarNumber ?? "-"}</p>
                <span className="w-fit rounded-full bg-[var(--color-panel-strong)] px-3 py-1 text-xs font-medium text-[var(--color-accent-strong)]">{customer.status}</span>
              </article>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-[var(--color-muted)]">No customers matched the current search.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
