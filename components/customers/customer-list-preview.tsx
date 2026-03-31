"use client";

import { useMemo, useState } from "react";

import { companyOptions, matchesCompanyFilter } from "@/lib/companies";

const previewCustomers = [
  {
    customerCode: "102344",
    fullName: "Priya S",
    phoneNumber: "+91 98400 12345",
    area: "Gandhipuram",
    company: "Vishnu Bankers - Main Branch",
    status: "Photo complete",
  },
  {
    customerCode: "102198",
    fullName: "Ramesh K",
    phoneNumber: "+91 98940 55123",
    area: "Pollachi",
    company: "Vishnu Bankers - Main Branch",
    status: "Address review",
  },
  {
    customerCode: "102145",
    fullName: "Meena V",
    phoneNumber: "+91 97890 44002",
    area: "Tiruppur",
    company: "Vishnu Bankers - Main Branch",
    status: "Ready for loan issue",
  },
  {
    customerCode: "103210",
    fullName: "Karthik R",
    phoneNumber: "+91 93450 22018",
    area: "Town Hall",
    company: "Vishnu Bankers - Town Office",
    status: "KYC complete",
  },
  {
    customerCode: "104011",
    fullName: "Divya N",
    phoneNumber: "+91 94433 90902",
    area: "Goldsmith Lane",
    company: "Vishnu Bankers - Gold Unit",
    status: "Ready for renewal",
  },
];

export function CustomerListPreview() {
  const [companyFilter, setCompanyFilter] = useState("");
  const filteredCustomers = useMemo(
    () => previewCustomers.filter((customer) => matchesCompanyFilter(customer.company, companyFilter)),
    [companyFilter],
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
            key={customer.customerCode}
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
      </div>
    </section>
  );
}
