import Link from "next/link";
import { ClipboardPenLine, Layers3, Search, Sparkles, WalletCards } from "lucide-react";

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
              Create, search, manage schemes, and correct entries
            </h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <WalletCards className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          <ActionCard href={`/loans/new${companyQuery}`} icon={<Sparkles className="h-5 w-5" />} title="Create new loan" description="Cash loan or jewel loan entry" hotkey="F4" />
          <ActionCard href={`/loans/search${companyQuery}`} icon={<Search className="h-5 w-5" />} title="Search loan" description="Search by customer, phone, or account number" hotkey="F5" />
          <ActionCard href={`/schemes${companyQuery}`} icon={<Layers3 className="h-5 w-5" />} title="Schemes" description="Manage day range and interest slabs" hotkey="F6" />
          <ActionCard href={`/adjustments${companyQuery}`} icon={<ClipboardPenLine className="h-5 w-5" />} title="Adjustments" description="Reverse or adjust mistaken payment entries" hotkey="F9" />
        </div>
      </section>
    </div>
  );
}

function ActionCard({ href, icon, title, description, hotkey }: { href: string; icon: import("react").ReactNode; title: string; description: string; hotkey: string }) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            {icon}
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--color-ink)]">
              {title}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {description}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--color-sidebar)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
          {hotkey}
        </span>
      </div>
    </Link>
  );
}
