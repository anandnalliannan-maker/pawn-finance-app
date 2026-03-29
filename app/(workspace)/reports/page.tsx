export default function ReportsPage() {
  return (
    <section className="app-panel rounded-[28px] p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Reports
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
        Reporting workspace reserved
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
        Dashboards, filters, ledger summaries, and company-level reports will sit here
        once the transaction modules are in place.
      </p>
    </section>
  );
}
