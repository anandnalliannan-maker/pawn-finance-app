import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type DashboardActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  hotkey: string;
};

export function DashboardActionCard({
  title,
  description,
  icon: Icon,
  hotkey,
}: DashboardActionCardProps) {
  return (
    <article className="rounded-[26px] border border-[var(--color-border)] bg-white/90 p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(66,45,13,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium tracking-[0.16em] text-white uppercase">
          {hotkey}
        </span>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-strong)]">
        Open workflow
        <ArrowRight className="h-4 w-4" />
      </div>
    </article>
  );
}
