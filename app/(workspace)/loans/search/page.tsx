const previewLoans = [
  {
    accountNumber: "2025-2026/108",
    customerName: "Priya S",
    phoneNumber: "+91 98400 12345",
    loanType: "Jewel Loan",
  },
  {
    accountNumber: "2025-2026/109",
    customerName: "Ramesh K",
    phoneNumber: "+91 98940 55123",
    loanType: "Cash Loan",
  },
];

export default function SearchLoanPage() {
  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Search Loan
        </p>
        <div className="mt-4 flex items-center rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]">
          Search by customer name, phone number, customer code, or account number
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="space-y-3">
          {previewLoans.map((loan) => (
            <article
              key={loan.accountNumber}
              className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"
            >
              <div className="grid gap-3 lg:grid-cols-[0.24fr_0.26fr_0.24fr_0.18fr] lg:items-center">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{loan.accountNumber}</p>
                <p className="text-sm text-[var(--color-ink)]">{loan.customerName}</p>
                <p className="text-sm text-[var(--color-muted)]">{loan.phoneNumber}</p>
                <p className="text-sm text-[var(--color-muted)]">{loan.loanType}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
