import Link from "next/link";
import { Layers3, Search, Sparkles, WalletCards } from "lucide-react";

export default async function LoansPage({
  searchParams,
}: PageProps<"/loans">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers - Main Branch";
  const companyQuery = `?company=${encodeURIComponent(company)}`;

  return (
    <div className="space-y-8">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Loan Actions
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              Create, search, and manage schemes
            </h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <WalletCards className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <Link
            href={`/loans/new${companyQuery}`}
            className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    Create new loan
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Cash loan or jewel loan entry
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F4
              </span>
            </div>
          </Link>

          <Link
            href={`/loans/search${companyQuery}`}
            className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    Search loan
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Search by customer, phone, or account number
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F5
              </span>
            </div>
          </Link>

          <Link
            href={`/schemes${companyQuery}`}
            className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    Schemes
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Manage day range and interest slabs
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F6
              </span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
