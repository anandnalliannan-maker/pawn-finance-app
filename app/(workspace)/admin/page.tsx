export default function AdminPage() {
  return (
    <section className="app-panel rounded-[28px] p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Admin
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
        Admin controls are scaffolded
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
        Company management, schemes, user roles, and profile administration will be
        added here after the operational modules are stable.
      </p>
    </section>
  );
}
