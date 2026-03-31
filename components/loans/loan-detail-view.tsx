"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  HandCoins,
  Save,
  UserRound,
  X,
} from "lucide-react";

import type { LoanPaymentRecord, LoanRecord } from "@/lib/loans";
import { getOutstandingLoanAmount } from "@/lib/loans";

type LoanDetailViewProps = {
  loan: LoanRecord;
};

type PaymentDraft = {
  paymentDate: string;
  paymentFrom: string;
  paymentUpto: string;
  principalPayment: string;
  interestPayment: string;
  notes: string;
};

function getTodayDisplayDate() {
  return new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
}

function formatCurrency(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

function toAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDisplayDate(value: string) {
  const [day, month, year] = value.split("-");
  if (!day || !month || !year) {
    return new Date(NaN);
  }

  return new Date(`${day} ${month} ${year}`);
}

function isInterestPaidUptoDate(payments: LoanPaymentRecord[]) {
  const lastPayment = payments[payments.length - 1];
  if (!lastPayment?.paymentUpto) {
    return false;
  }

  const paidUpto = parseDisplayDate(lastPayment.paymentUpto);
  const today = parseDisplayDate(getTodayDisplayDate());

  if (Number.isNaN(paidUpto.getTime()) || Number.isNaN(today.getTime())) {
    return false;
  }

  return paidUpto >= today;
}

function buildInitialDraft(loan: LoanRecord): PaymentDraft {
  const lastPayment = loan.payments[loan.payments.length - 1];

  return {
    paymentDate: getTodayDisplayDate(),
    paymentFrom: lastPayment?.paymentUpto ?? loan.loanDate,
    paymentUpto: getTodayDisplayDate(),
    principalPayment: "",
    interestPayment: "",
    notes: "",
  };
}

export function LoanDetailView({ loan }: LoanDetailViewProps) {
  const [payments, setPayments] = useState<LoanPaymentRecord[]>(loan.payments);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCloseLoanModal, setShowCloseLoanModal] = useState(false);
  const [closeAcknowledged, setCloseAcknowledged] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(() => buildInitialDraft(loan));
  const [isClosed, setIsClosed] = useState(loan.status === "Closed");
  const [statusMessage, setStatusMessage] = useState(
    "Loan detail view is ready. Payment entry is updating the local preview until backend save is wired.",
  );

  const outstandingLoan = useMemo(
    () => getOutstandingLoanAmount({ ...loan, payments }),
    [loan, payments],
  );
  const totalInterestPaid = payments.reduce(
    (total, payment) => total + payment.interestPayment,
    0,
  );
  const totalPrincipalPaid = payments.reduce(
    (total, payment) => total + payment.principalPayment,
    0,
  );
  const interestCleared = isInterestPaidUptoDate(payments);
  const canCloseLoan = outstandingLoan === 0 && interestCleared;
  const liveStatus = isClosed ? "Closed" : "Active";

  function openPaymentModal() {
    setPaymentDraft(buildInitialDraft({ ...loan, payments }));
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
  }

  function openCloseLoanModal() {
    setCloseAcknowledged(false);
    setShowCloseLoanModal(true);
  }

  function closeCloseLoanModal() {
    setShowCloseLoanModal(false);
  }

  function handleDraftChange(field: keyof PaymentDraft, value: string) {
    setPaymentDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const principalPayment = Math.min(toAmount(paymentDraft.principalPayment), outstandingLoan);
    const interestPayment = toAmount(paymentDraft.interestPayment);

    const newPayment: LoanPaymentRecord = {
      id: `payment-${Date.now()}`,
      paymentDate: paymentDraft.paymentDate,
      paymentFrom: paymentDraft.paymentFrom,
      paymentUpto: paymentDraft.paymentUpto,
      principalPayment,
      interestPayment,
      notes: paymentDraft.notes.trim() || undefined,
    };

    setPayments((current) => [...current, newPayment]);
    setIsClosed(false);

    const nextOutstanding = Math.max(outstandingLoan - principalPayment, 0);
    setStatusMessage(
      `Payment recorded for ${loan.customerName}. Outstanding loan is now ${formatCurrency(nextOutstanding)}.`,
    );
    setShowPaymentModal(false);
  }

  function handleCloseLoan() {
    if (!canCloseLoan) {
      setStatusMessage(
        "Loan cannot be closed until the full principal is paid and interest is cleared up to today.",
      );
      setShowCloseLoanModal(false);
      return;
    }

    if (!closeAcknowledged) {
      setStatusMessage(
        "Staff acknowledgement is required before closing the loan.",
      );
      return;
    }

    setIsClosed(true);
    setStatusMessage(`Loan ${loan.accountNumber} has been marked as closed.`);
    setShowCloseLoanModal(false);
  }

  return (
    <>
      <div className="space-y-6">
        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Loan Details
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                {loan.accountNumber}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {loan.loanType} · {loan.company}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-[var(--color-panel-strong)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]">
                Original loan: {formatCurrency(loan.originalLoanAmount)}
              </div>
              <div className="rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white">
                Outstanding loan: {formatCurrency(outstandingLoan)}
              </div>
              <button
                type="button"
                onClick={openPaymentModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                <CircleDollarSign className="h-4 w-4" />
                Make payment
              </button>
              <button
                type="button"
                onClick={openCloseLoanModal}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
              >
                <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
                Close loan
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="app-panel rounded-[30px] p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--color-panel-strong)] text-xl font-semibold text-[var(--color-accent-strong)]">
                {loan.customerPhotoLabel || <UserRound className="h-8 w-8" />}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Customer
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                  {loan.customerName}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Customer ID {loan.customerCode}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Phone no." value={loan.phoneNumber} />
              <InfoCard label="Area" value={loan.area} />
              <InfoCard label="Current address" value={loan.currentAddress} className="sm:col-span-2" />
              <InfoCard label="Permanent address" value={loan.permanentAddress} className="sm:col-span-2" />
              <InfoCard label="Aadhaar number" value={loan.aadhaarNumber} />
              <InfoCard label="Supporting documents" value={`${loan.supportingDocumentCount} attached`} />
            </div>
          </article>

          <article className="app-panel rounded-[30px] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Loan Snapshot
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Status" value={liveStatus} />
              <InfoCard label="Date" value={loan.loanDate} />
              <InfoCard label="Loan type" value={loan.loanType} />
              <InfoCard label="Scheme" value={loan.schemeName} />
              <InfoCard label="Interest %" value={`${loan.interestPercent.toFixed(2)}%`} />
              <InfoCard label="Total principal paid" value={formatCurrency(totalPrincipalPaid)} />
              <InfoCard label="Total interest paid" value={formatCurrency(totalInterestPaid)} />
              <InfoCard label="Outstanding loan" value={formatCurrency(outstandingLoan)} />
              <InfoCard label="Interest cleared upto today" value={interestCleared ? "Yes" : "No"} />
            </div>

            {loan.jewelDetails?.length ? (
              <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                      <th className="px-4 py-3 font-semibold">Jewel Type</th>
                      <th className="px-4 py-3 font-semibold">Jewel wt.</th>
                      <th className="px-4 py-3 font-semibold">Stone wt.</th>
                      <th className="px-4 py-3 font-semibold">Gold wt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loan.jewelDetails.map((row) => (
                      <tr key={row.id} className="border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]">
                        <td className="px-4 py-3">{row.jewelType}</td>
                        <td className="px-4 py-3">{row.jewelWeight}</td>
                        <td className="px-4 py-3">{row.stoneWeight}</td>
                        <td className="px-4 py-3">{row.goldWeight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </section>

        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Payment History
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {statusMessage}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openPaymentModal}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
              >
                <HandCoins className="h-4 w-4 text-[var(--color-accent)]" />
                Make payment
              </button>
              <button
                type="button"
                onClick={openCloseLoanModal}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
              >
                <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
                Close loan
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Interest from</th>
                  <th className="px-4 py-3 font-semibold">Interest upto</th>
                  <th className="px-4 py-3 font-semibold">Principal payment</th>
                  <th className="px-4 py-3 font-semibold">Interest payment</th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]">
                      <td className="px-4 py-3">{payment.paymentDate}</td>
                      <td className="px-4 py-3">{payment.paymentFrom}</td>
                      <td className="px-4 py-3">{payment.paymentUpto}</td>
                      <td className="px-4 py-3">{formatCurrency(payment.principalPayment)}</td>
                      <td className="px-4 py-3">{formatCurrency(payment.interestPayment)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4">
          <div className="w-full max-w-2xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Record Payment
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                  {loan.accountNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
                aria-label="Close payment popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  icon={<FileText className="h-4 w-4 text-[var(--color-accent)]" />}
                  label="Original loan"
                  value={formatCurrency(loan.originalLoanAmount)}
                />
                <MetricCard
                  icon={<HandCoins className="h-4 w-4 text-[var(--color-accent)]" />}
                  label="Outstanding loan"
                  value={formatCurrency(outstandingLoan)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Payment date</span>
                  <input
                    value={paymentDraft.paymentDate}
                    onChange={(event) => handleDraftChange("paymentDate", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Principal payment</span>
                  <input
                    value={paymentDraft.principalPayment}
                    onChange={(event) => handleDraftChange("principalPayment", event.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Interest payment from</span>
                  <input
                    value={paymentDraft.paymentFrom}
                    onChange={(event) => handleDraftChange("paymentFrom", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Interest payment upto</span>
                  <input
                    value={paymentDraft.paymentUpto}
                    onChange={(event) => handleDraftChange("paymentUpto", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Interest payment</span>
                  <input
                    value={paymentDraft.interestPayment}
                    onChange={(event) => handleDraftChange("interestPayment", event.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Remarks</span>
                  <textarea
                    value={paymentDraft.notes}
                    onChange={(event) => handleDraftChange("notes", event.target.value)}
                    rows={3}
                    placeholder="Optional note for this payment"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <CalendarClock className="h-4 w-4 text-[var(--color-accent)]" />
                  Principal payment reduces the outstanding loan immediately.
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
                >
                  <Save className="h-4 w-4" />
                  Save payment
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showCloseLoanModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4">
          <div className="w-full max-w-xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Close Loan
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                  {loan.accountNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCloseLoanModal}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
                aria-label="Close loan popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MetricCard
                icon={<HandCoins className="h-4 w-4 text-[var(--color-accent)]" />}
                label="Outstanding loan"
                value={formatCurrency(outstandingLoan)}
              />
              <MetricCard
                icon={<CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />}
                label="Interest cleared upto today"
                value={interestCleared ? "Yes" : "No"}
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                <p>
                  Loan closure is allowed only when the full principal amount is paid and interest is cleared up to today.
                </p>
              </div>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-[24px] border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={closeAcknowledged}
                onChange={(event) => setCloseAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
              />
              <span>
                I confirm that the full principal amount and upto date interest have been collected and verified.
              </span>
            </label>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseLoan}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function InfoCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 ${className}`}>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: import("react").ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
