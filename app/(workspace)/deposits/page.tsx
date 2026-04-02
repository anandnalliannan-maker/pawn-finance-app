import Link from "next/link";
import { FileSearch, Landmark, PlusCircle } from "lucide-react";

export default async function DepositsPage({
  searchParams,
}: PageProps<"/deposits">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers";
  const companyQuery = `?company=${encodeURIComponent(company)}`;

  return (
    <section className="app-panel rounded-[30px] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Deposits</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Depositor accounts</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Record borrowed funds from outside parties and review payout history.</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
          <Landmark className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href={`/deposits/new${companyQuery}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1">
          <PlusCircle className="h-6 w-6 text-[var(--color-accent)]" />
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Create Deposit</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Capture depositor, amount, interest, and attachments.</p>
        </Link>
        <Link href={`/deposits/search${companyQuery}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1">
          <FileSearch className="h-6 w-6 text-[var(--color-accent)]" />
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Search Deposit</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Review deposit status and payout activity.</p>
        </Link>
      </div>
    </section>
  );
}
