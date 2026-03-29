import Link from "next/link";
import { ArrowRight, Building2, Landmark, MapPin } from "lucide-react";

const companies = [
  {
    name: "Anand Finance - Main Branch",
    code: "AFM001",
    location: "Coimbatore",
    focus: "Primary pawn desk, customer onboarding, cash loan issuance",
  },
  {
    name: "Anand Finance - Town Office",
    code: "AFT002",
    location: "Pollachi",
    focus: "Interest collection, renewals, and branch reconciliation",
  },
  {
    name: "Anand Finance - Gold Unit",
    code: "AFG003",
    location: "Tiruppur",
    focus: "Jewel loan operations, appraisal notes, and secure storage",
  },
];

export default function SelectCompanyPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[28px] bg-[linear-gradient(135deg,rgba(180,83,9,0.12),rgba(255,255,255,0.72))] p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Company Selection
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl">
            Choose the branch before entering the workspace
          </h1>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
            Each company will eventually enforce separate access, reports,
            customers, and loan visibility through role and row-level security.
          </p>
        </div>
        <div className="rounded-3xl bg-white/80 px-5 py-4 text-sm text-[var(--color-muted)] shadow-sm">
          <p className="font-semibold text-[var(--color-ink)]">Phase 1 baseline</p>
          <p className="mt-1">Static options now, Supabase-backed company access next.</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {companies.map((company) => (
          <article
            key={company.code}
            className="app-panel rounded-[28px] p-6 transition hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium tracking-[0.18em] text-white uppercase">
                {company.code}
              </span>
            </div>

            <h2 className="mt-6 text-xl font-semibold text-[var(--color-ink)]">
              {company.name}
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted)]">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
                <span>{company.location}</span>
              </div>
              <div className="flex items-start gap-3">
                <Landmark className="mt-1 h-4 w-4 text-[var(--color-accent)]" />
                <span>{company.focus}</span>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Enter this company
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
