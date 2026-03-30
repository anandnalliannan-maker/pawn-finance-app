"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CircleDollarSign,
  FileText,
  Landmark,
  Save,
  X,
} from "lucide-react";

import type { DepositPaymentRecord, DepositRecord } from "@/lib/deposits";
import { getOutstandingDepositAmount } from "@/lib/deposits";

type DepositDetailViewProps = {
  deposit: DepositRecord;
};

type PayoutDraft = {
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

function buildInitialDraft(deposit: DepositRecord): PayoutDraft {
  const lastPayment = deposit.payments[deposit.payments.length - 1];

  return {
    paymentDate: getTodayDisplayDate(),
    paymentFrom: lastPayment?.paymentUpto ?? deposit.depositDate,
    paymentUpto: getTodayDisplayDate(),
    principalPayment: "",
    interestPayment: "",
    notes: "",
  };
}

export function DepositDetailView({ deposit }: DepositDetailViewProps) {
  const [payments, setPayments] = useState<DepositPaymentRecord[]>(deposit.payments);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutDraft, setPayoutDraft] = useState<PayoutDraft>(() => buildInitialDraft(deposit));
  const [statusMessage, setStatusMessage] = useState(
    "Deposit detail view is ready. Payout entry is updating the local preview until backend save is wired.",
  );

  const liveDeposit = useMemo<DepositRecord>(
    () => ({
      ...deposit,
      payments,
      status: getOutstandingDepositAmount({ ...deposit, payments }) === 0 ? "Closed" : "Active",
    }),
    [deposit, payments],
  );

  const outstandingDeposit = getOutstandingDepositAmount(liveDeposit);
  const totalPrincipalPaid = payments.reduce(
    (total, payment) => total + payment.principalPayment,
    0,
  );
  const totalInterestPaid = payments.reduce(
    (total, payment) => total + payment.interestPayment,
    0,
  );

  function openPayoutModal() {
    setPayoutDraft(buildInitialDraft(liveDeposit));
    setShowPayoutModal(true);
  }

  function closePayoutModal() {
    setShowPayoutModal(false);
  }

  function handleDraftChange(field: keyof PayoutDraft, value: string) {
    setPayoutDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePayoutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const principalPayment = Math.min(toAmount(payoutDraft.principalPayment), outstandingDeposit);
    const interestPayment = toAmount(payoutDraft.interestPayment);

    const newPayment: DepositPaymentRecord = {
      id: `deposit-payment-${Date.now()}`,
      paymentDate: payoutDraft.paymentDate,
      paymentFrom: payoutDraft.paymentFrom,
      paymentUpto: payoutDraft.paymentUpto,
      principalPayment,
      interestPayment,
      notes: payoutDraft.notes.trim() || undefined,
    };

    setPayments((current) => [...current, newPayment]);

    const nextOutstanding = Math.max(outstandingDeposit - principalPayment, 0);
    setStatusMessage(
      `Payout recorded for ${deposit.depositorName}. Outstanding deposit is now ${formatCurrency(nextOutstanding)}.`,
    );
    setShowPayoutModal(false);
  }

  return (
    <>
      <div className="space-y-6">
        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Deposit Details
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                {deposit.depositorName}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Depositor ID {deposit.depositorCode} · {deposit.company}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-[var(--color-panel-strong)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]">
                Original deposit: {formatCurrency(deposit.depositAmount)}
              </div>
              <div className="rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white">
                Outstanding deposit: {formatCurrency(outstandingDeposit)}
              </div>
              <button
                type="button"
                onClick={openPayoutModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                <CircleDollarSign className="h-4 w-4" />
                Record payout
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="app-panel rounded-[30px] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Depositer Details
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Depositer name" value={deposit.depositorName} />
              <InfoCard label="Phone no." value={deposit.phoneNumber} />
              <InfoCard label="Address" value={deposit.address} className="sm:col-span-2" />
              <InfoCard label="Reference" value={deposit.reference} />
              <InfoCard label="Attachments" value={`${deposit.attachmentCount} attached`} />
            </div>
          </article>

          <article className="app-panel rounded-[30px] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Deposit Snapshot
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Status" value={liveDeposit.status} />
              <InfoCard label="Date" value={deposit.depositDate} />
              <InfoCard label="Interest %" value={`${deposit.interestPercent.toFixed(2)}%`} />
              <InfoCard label="Total principal paid" value={formatCurrency(totalPrincipalPaid)} />
              <InfoCard label="Total interest paid" value={formatCurrency(totalInterestPaid)} />
              <InfoCard label="Outstanding deposit" value={formatCurrency(outstandingDeposit)} />
            </div>
          </article>
        </section>

        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Payout History
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {statusMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={openPayoutModal}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
            >
              <Landmark className="h-4 w-4 text-[var(--color-accent)]" />
              Record payout
            </button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Interest from</th>
                  <th className="px-4 py-3 font-semibold">Interest upto</th>
                  <th className="px-4 py-3 font-semibold">Principal payout</th>
                  <th className="px-4 py-3 font-semibold">Interest payout</th>
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
                      No payouts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showPayoutModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4">
          <div className="w-full max-w-2xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Record Payout
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                  {deposit.depositorName}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePayoutModal}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
                aria-label="Close payout popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  icon={<FileText className="h-4 w-4 text-[var(--color-accent)]" />}
                  label="Original deposit"
                  value={formatCurrency(deposit.depositAmount)}
                />
                <MetricCard
                  icon={<Landmark className="h-4 w-4 text-[var(--color-accent)]" />}
                  label="Outstanding deposit"
                  value={formatCurrency(outstandingDeposit)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Payment date</span>
                  <input
                    value={payoutDraft.paymentDate}
                    onChange={(event) => handleDraftChange("paymentDate", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Principal payout</span>
                  <input
                    value={payoutDraft.principalPayment}
                    onChange={(event) => handleDraftChange("principalPayment", event.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Interest payment from</span>
                  <input
                    value={payoutDraft.paymentFrom}
                    onChange={(event) => handleDraftChange("paymentFrom", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Interest payment upto</span>
                  <input
                    value={payoutDraft.paymentUpto}
                    onChange={(event) => handleDraftChange("paymentUpto", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-muted)]">Interest payout</span>
                  <input
                    value={payoutDraft.interestPayment}
                    onChange={(event) => handleDraftChange("interestPayment", event.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <CalendarClock className="h-4 w-4 text-[var(--color-accent)]" />
                  Principal payout reduces the outstanding deposit immediately.
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
                >
                  <Save className="h-4 w-4" />
                  Save payout
                </button>
              </div>
            </form>
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
