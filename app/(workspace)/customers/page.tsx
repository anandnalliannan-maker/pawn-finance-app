import Link from "next/link";
import { Camera, History, Search, ShieldCheck, UserPlus, UsersRound } from "lucide-react";

import { CustomerListPreview } from "@/components/customers/customer-list-preview";

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers";
  const companyQuery = `?company=${encodeURIComponent(company)}`;

  return (
    <div className="space-y-8">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Quick Actions
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              Operator shortcuts
            </h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <UsersRound className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <Link
            href={`/customers/new${companyQuery}`}
            className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    New Customer
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Register customer details
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F2
              </span>
            </div>
          </Link>

          <article className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    Search & edit
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Search by name, phone number, or customer code
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
                F3
              </span>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                <Camera className="h-4 w-4 text-[var(--color-accent)]" />
                Photo capture
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                <History className="h-4 w-4 text-[var(--color-accent)]" />
                Edit history
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                Company access
              </div>
            </div>
          </article>
        </div>
      </section>

      <CustomerListPreview />
    </div>
  );
}
