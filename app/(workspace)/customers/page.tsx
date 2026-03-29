export default function CustomersPage() {
  return (
    <section className="app-panel rounded-[28px] p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Customers
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
        Customer module is next
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
        This route is reserved for registration, profile management, photo capture,
        and history tracking. It is the next module to implement after the shell
        and navigation baseline.
      </p>
    </section>
  );
}
