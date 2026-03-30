const previewCustomers = [
  {
    customerCode: "102344",
    fullName: "Priya S",
    phoneNumber: "+91 98400 12345",
    area: "Gandhipuram",
    status: "Photo complete",
  },
  {
    customerCode: "102198",
    fullName: "Ramesh K",
    phoneNumber: "+91 98940 55123",
    area: "Pollachi",
    status: "Address review",
  },
  {
    customerCode: "102145",
    fullName: "Meena V",
    phoneNumber: "+91 97890 44002",
    area: "Tiruppur",
    status: "Ready for loan issue",
  },
];

export function CustomerListPreview() {
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
        <div className="rounded-2xl bg-[var(--color-panel-strong)] px-4 py-2 text-sm font-medium text-[var(--color-accent-strong)]">
          Search-ready
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {previewCustomers.map((customer) => (
          <article
            key={customer.customerCode}
            className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"
          >
            <div className="grid gap-4 lg:grid-cols-[0.18fr_0.28fr_0.24fr_0.18fr_0.12fr] lg:items-center">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                #{customer.customerCode}
              </p>
              <p className="text-sm text-[var(--color-ink)]">{customer.fullName}</p>
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
