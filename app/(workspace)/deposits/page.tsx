import Link from "next/link";
import { Landmark, Search, Sparkles } from "lucide-react";

export default async function DepositsPage({
  searchParams,
}: PageProps<"/deposits">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers - Main Branch";
  const companyQuery = `?company=${encodeURIComponent(company)}`;

  return (
    <div className="space-y-8">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Deposit Actions
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              Register and search outside business deposits
            </h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <Link
            href={`/deposits/new${companyQuery}`}
            className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    Create deposit
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Capture depositor, amount, interest, and attachments
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F7
              </span>
            </div>
          </Link>

          <Link
            href={`/deposits/search${companyQuery}`}
            className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    Search deposit
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Search by depositor name, phone number, or deposit ID
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F8
              </span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
