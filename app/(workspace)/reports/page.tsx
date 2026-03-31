import { ALL_COMPANIES } from "@/lib/companies";
import { previewDeposits } from "@/lib/deposits";
import { previewLoans } from "@/lib/loans";

export default async function ReportsPage({
  searchParams,
}: PageProps<"/reports">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : ALL_COMPANIES;

  const scopedLoans = previewLoans.filter((loan) => company === ALL_COMPANIES || loan.company === company);
  const scopedDeposits = previewDeposits.filter((deposit) => company === ALL_COMPANIES || deposit.company === company);
  const activeLoans = scopedLoans.filter((loan) => loan.status === "Active").length;
  const activeDeposits = scopedDeposits.filter((deposit) => deposit.status === "Active").length;

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[28px] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Reports
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
          Reporting workspace reserved
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-muted)]">
          The top company dropdown now acts as the company filter for reports. Switch between all companies or a single branch before opening detailed dashboards.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard label="Company scope" value={company} />
        <ReportCard label="Loans in view" value={String(scopedLoans.length)} />
        <ReportCard label="Deposits in view" value={String(scopedDeposits.length)} />
        <ReportCard label="Active loans" value={String(activeLoans)} />
        <ReportCard label="Active deposits" value={String(activeDeposits)} />
        <ReportCard label="Next step" value="Dashboards and exports" />
      </section>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="app-panel rounded-[24px] p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{value}</p>
    </article>
  );
}
