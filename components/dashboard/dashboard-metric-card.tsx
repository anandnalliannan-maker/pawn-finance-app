type DashboardMetricCardProps = {
  label: string;
  value: string;
  trend: string;
  tone: "amber" | "slate" | "teal" | "stone";
};

const toneClasses: Record<DashboardMetricCardProps["tone"], string> = {
  amber: "bg-amber-100 text-amber-900",
  slate: "bg-slate-100 text-slate-900",
  teal: "bg-teal-100 text-teal-900",
  stone: "bg-stone-200 text-stone-900",
};

export function DashboardMetricCard({
  label,
  value,
  trend,
  tone,
}: DashboardMetricCardProps) {
  return (
    <article className="app-panel rounded-[26px] p-5">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneClasses[tone]}`}
      >
        {label}
      </span>
      <p className="mt-6 text-3xl font-semibold text-[var(--color-ink)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{trend}</p>
    </article>
  );
}
