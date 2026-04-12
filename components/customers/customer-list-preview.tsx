"use client";

import { useEffect, useMemo, useState } from "react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import type { CustomerListItem } from "@/lib/customers";

export function CustomerListPreview() {
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [customerIdFilter, setCustomerIdFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
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

  const filteredCustomers = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    const normalizedPhone = phoneFilter.replace(/\s+/g, "").trim();
    const normalizedCustomerId = customerIdFilter.trim().toLowerCase();
    const normalizedArea = areaFilter.trim().toLowerCase();

    return customers.filter((customer) => {
      if (!matchesCompanyFilter(customer.company, companyFilter)) {
        return false;
      }

      const matchesName = normalizedName ? customer.fullName.toLowerCase().includes(normalizedName) : true;
      const matchesPhone = normalizedPhone ? customer.phoneNumber.replace(/\s+/g, "").includes(normalizedPhone) : true;
      const matchesCustomerId = normalizedCustomerId ? customer.customerCode.toLowerCase().includes(normalizedCustomerId) : true;
      const matchesArea = normalizedArea ? customer.area.toLowerCase().includes(normalizedArea) : true;

      return matchesName && matchesPhone && matchesCustomerId && matchesArea;
    });
  }, [areaFilter, companyFilter, customerIdFilter, customers, nameFilter, phoneFilter]);

  return (
    <section className="app-panel rounded-[30px] p-6 sm:p-8">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Search Customer
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">Find and review customer records</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.15fr_1fr_0.9fr_0.9fr_1fr]">
          <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} placeholder="Customer name" />
          <FilterInput label="Phone no." value={phoneFilter} onChange={setPhoneFilter} placeholder="Phone number" />
          <FilterInput label="Customer ID" value={customerIdFilter} onChange={setCustomerIdFilter} placeholder="Customer ID" />
          <FilterInput label="Area" value={areaFilter} onChange={setAreaFilter} placeholder="Area" />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Company</span>
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
          </label>
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

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--color-muted)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]"
      />
    </label>
  );
}
