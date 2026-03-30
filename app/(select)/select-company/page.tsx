import Link from "next/link";
import { Building2 } from "lucide-react";

const companies = [
  {
    name: "Vishnu Bankers - Main Branch",
    code: "VBM001",
  },
  {
    name: "Vishnu Bankers - Town Office",
    code: "VBT002",
  },
  {
    name: "Vishnu Bankers - Gold Unit",
    code: "VBG003",
  },
];

export default function SelectCompanyPage() {
  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.48)] p-6 shadow-[0_40px_90px_rgba(54,39,19,0.15)] sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Company Selection
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
            Select company
          </h1>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.code}
              href={`/dashboard?company=${encodeURIComponent(company.name)}`}
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
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
