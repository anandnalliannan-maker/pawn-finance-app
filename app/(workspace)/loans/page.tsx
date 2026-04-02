import Link from "next/link";
import { ArrowRightLeft, FileSearch, HandCoins, PlusCircle, Settings2 } from "lucide-react";

export default async function LoansPage({
  searchParams,
}: PageProps<"/loans">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers";
  const companyQuery = `?company=${encodeURIComponent(company)}`;

  return (
    <section className="app-panel rounded-[30px] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Loans</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Loan operations</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Create loans, search accounts, maintain schemes, and review payment adjustments.</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
          <HandCoins className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href={`/loans/new${companyQuery}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1">
          <PlusCircle className="h-6 w-6 text-[var(--color-accent)]" />
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Create New Loan</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Issue a new cash or jewel loan.</p>
        </Link>
        <Link href={`/loans/search${companyQuery}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1">
          <FileSearch className="h-6 w-6 text-[var(--color-accent)]" />
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Search Loan</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Find active and closed accounts quickly.</p>
        </Link>
        <Link href={`/schemes${companyQuery}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1">
          <Settings2 className="h-6 w-6 text-[var(--color-accent)]" />
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Schemes</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Maintain shared simple-interest slabs.</p>
        </Link>
        <Link href={`/adjustments${companyQuery}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1">
          <ArrowRightLeft className="h-6 w-6 text-[var(--color-accent)]" />
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">Adjustments</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Reverse or correct mistaken payment entries.</p>
        </Link>
      </div>
    </section>
  );
}
