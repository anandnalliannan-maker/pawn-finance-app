
"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardPenLine,
  FileText,
  HandCoins,
  Save,
  UserRound,
  X,
} from "lucide-react";

import {
  buildEffectiveLoanPayments,
  buildFullReversalDraft,
  formatAdjustmentDelta,
  getAdjustedOutstandingLoanAmount,
  getPaymentAdjustmentsForLoan,
  isInterestPaidUptoDateFromEffectivePayments,
  loadPaymentAdjustments,
  savePaymentAdjustments,
  todayDisplayDate,
  type PaymentAdjustmentRecord,
  type PaymentAdjustmentType,
} from "@/lib/adjustments";
import { formatIsoDate, toIsoDateFromDisplay } from "@/lib/date-utils";
import type { LoanPaymentRecord, LoanRecord } from "@/lib/loans";

type LoanDetailViewProps = { loan: LoanRecord };
type PaymentDraft = {
  paymentDate: string;
  paymentFrom: string;
  paymentUpto: string;
  principalPayment: string;
  interestPayment: string;
  notes: string;
};
type AdjustmentDraft = {
  correctionType: PaymentAdjustmentType;
  principalAdjustment: string;
  interestAdjustment: string;
  correctedPaymentFrom: string;
  correctedPaymentUpto: string;
  reason: string;
  acknowledgedBy: string;
};

function formatCurrency(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

function toAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildInitialDraft(loan: LoanRecord): PaymentDraft {
  const lastPayment = loan.payments[loan.payments.length - 1];
  return {
    paymentDate: formatIsoDate(new Date()),
    paymentFrom: toIsoDateFromDisplay(lastPayment?.paymentUpto ?? loan.loanDate),
    paymentUpto: formatIsoDate(new Date()),
    principalPayment: "",
    interestPayment: "",
    notes: "",
  };
}

function buildInitialAdjustmentDraft(payment: LoanPaymentRecord): AdjustmentDraft {
  const reversal = buildFullReversalDraft(payment);
  return {
    correctionType: "Full Reversal",
    principalAdjustment: reversal.principalAdjustment,
    interestAdjustment: reversal.interestAdjustment,
    correctedPaymentFrom: toIsoDateFromDisplay(reversal.correctedPaymentFrom),
    correctedPaymentUpto: toIsoDateFromDisplay(reversal.correctedPaymentUpto),
    reason: "",
    acknowledgedBy: "Admin",
  };
}

export function LoanDetailView({ loan }: LoanDetailViewProps) {
  const [loanState, setLoanState] = useState(loan);
  const [adjustments, setAdjustments] = useState<PaymentAdjustmentRecord[]>(() =>
    getPaymentAdjustmentsForLoan(loan.id, loadPaymentAdjustments()),
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCloseLoanModal, setShowCloseLoanModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [closeAcknowledged, setCloseAcknowledged] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(() => buildInitialDraft(loan));
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [adjustmentDraft, setAdjustmentDraft] = useState<AdjustmentDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Loan detail view is connected to Supabase for payments and close-loan actions. Adjustments remain local until their backend tables are added.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectivePayments = useMemo(
    () => buildEffectiveLoanPayments(loanState.payments, adjustments),
    [adjustments, loanState.payments],
  );
  const outstandingLoan = useMemo(
    () => getAdjustedOutstandingLoanAmount(loanState.originalLoanAmount, loanState.payments, adjustments),
    [adjustments, loanState.originalLoanAmount, loanState.payments],
  );
  const totalInterestPaid = effectivePayments.reduce((total, payment) => total + payment.netInterestPayment, 0);
  const totalPrincipalPaid = effectivePayments.reduce((total, payment) => total + payment.netPrincipalPayment, 0);
  const interestCleared = isInterestPaidUptoDateFromEffectivePayments(effectivePayments);
  const canCloseLoan = outstandingLoan === 0 && interestCleared;
  const selectedPayment = loanState.payments.find((payment) => payment.id === selectedPaymentId) ?? null;

  function openPaymentModal() {
    setPaymentDraft(buildInitialDraft(loanState));
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
  }

  function openAdjustmentModal(payment?: LoanPaymentRecord) {
    const targetPayment = payment ?? loanState.payments[loanState.payments.length - 1];
    if (!targetPayment) {
      setStatusMessage("No payment is available yet. Record a payment before posting an adjustment.");
      return;
    }

    setSelectedPaymentId(targetPayment.id);
    setAdjustmentDraft(buildInitialAdjustmentDraft(targetPayment));
    setShowAdjustmentModal(true);
  }

  function closeAdjustmentModal() {
    setShowAdjustmentModal(false);
    setSelectedPaymentId(null);
    setAdjustmentDraft(null);
  }

  function openCloseLoanModal() {
    setCloseAcknowledged(false);
    setShowCloseLoanModal(true);
  }

  function closeCloseLoanModal() {
    setShowCloseLoanModal(false);
  }

  function handleDraftChange(field: keyof PaymentDraft, value: string) {
    setPaymentDraft((current) => ({ ...current, [field]: value }));
  }

  function handleAdjustmentDraftChange(field: keyof AdjustmentDraft, value: string) {
    setAdjustmentDraft((current) => (current ? { ...current, [field]: value } : current));
  }
  async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/loans/${loanState.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentDate: paymentDraft.paymentDate,
          paymentFrom: paymentDraft.paymentFrom,
          paymentUpto: paymentDraft.paymentUpto,
          principalPayment: Math.min(toAmount(paymentDraft.principalPayment), outstandingLoan),
          interestPayment: toAmount(paymentDraft.interestPayment),
          notes: paymentDraft.notes,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save payment.");
        return;
      }

      if (result.loan) {
        setLoanState(result.loan as LoanRecord);
      }
      setStatusMessage(result.message ?? `Payment recorded for ${loanState.customerName}.`);
      setShowPaymentModal(false);
    } catch {
      setStatusMessage("Unable to reach the payment endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAdjustmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPayment || !adjustmentDraft) {
      return;
    }

    if (!adjustmentDraft.reason.trim()) {
      setStatusMessage("Adjustment reason is mandatory.");
      return;
    }

    if (!adjustmentDraft.acknowledgedBy.trim()) {
      setStatusMessage("Staff acknowledgement is mandatory for corrections.");
      return;
    }

    const newAdjustment: PaymentAdjustmentRecord = {
      id: `adjustment-${adjustments.length + 1}`,
      loanId: loanState.id,
      loanAccountNumber: loanState.accountNumber,
      company: loanState.company,
      customerName: loanState.customerName,
      originalPaymentId: selectedPayment.id,
      originalPaymentDate: selectedPayment.paymentDate,
      correctionType: adjustmentDraft.correctionType,
      principalAdjustment: toAmount(adjustmentDraft.principalAdjustment),
      interestAdjustment: toAmount(adjustmentDraft.interestAdjustment),
      correctedPaymentFrom: adjustmentDraft.correctedPaymentFrom,
      correctedPaymentUpto: adjustmentDraft.correctedPaymentUpto,
      reason: adjustmentDraft.reason.trim(),
      acknowledgedBy: adjustmentDraft.acknowledgedBy.trim(),
      createdAt: todayDisplayDate(),
      status: "Posted",
    };

    const nextAllAdjustments = [...loadPaymentAdjustments(), newAdjustment];
    const nextLoanAdjustments = getPaymentAdjustmentsForLoan(loanState.id, nextAllAdjustments);
    savePaymentAdjustments(nextAllAdjustments);
    setAdjustments(nextLoanAdjustments);
    setStatusMessage(`Adjustment posted for payment dated ${selectedPayment.paymentDate}. Original entry remains preserved for audit.`);
    closeAdjustmentModal();
  }

  async function handleCloseLoan() {
    if (!canCloseLoan) {
      setStatusMessage("Loan cannot be closed until the full principal is paid and interest is cleared up to today.");
      setShowCloseLoanModal(false);
      return;
    }
    if (!closeAcknowledged) {
      setStatusMessage("Staff acknowledgement is required before closing the loan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/loans/${loanState.id}/close`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to close loan.");
        return;
      }

      if (result.loan) {
        setLoanState(result.loan as LoanRecord);
      }
      setStatusMessage(result.message ?? `Loan ${loanState.accountNumber} has been marked as closed.`);
      setShowCloseLoanModal(false);
    } catch {
      setStatusMessage("Unable to reach the close-loan endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Loan Details</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">{loanState.accountNumber}</h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{loanState.loanType} | {loanState.company}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-[var(--color-panel-strong)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]">Original loan: {formatCurrency(loanState.originalLoanAmount)}</div>
              <div className="rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white">Outstanding loan: {formatCurrency(outstandingLoan)}</div>
              <button type="button" onClick={openPaymentModal} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"><CircleDollarSign className="h-4 w-4" />Make payment</button>
              <button type="button" onClick={() => openAdjustmentModal()} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><ClipboardPenLine className="h-4 w-4 text-[var(--color-accent)]" />Adjustment</button>
              <button type="button" onClick={openCloseLoanModal} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />Close loan</button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="app-panel rounded-[30px] p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--color-panel-strong)] text-xl font-semibold text-[var(--color-accent-strong)]">{loanState.customerPhotoLabel || <UserRound className="h-8 w-8" />}</div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Customer</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{loanState.customerName}</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">Customer ID {loanState.customerCode}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Phone no." value={loanState.phoneNumber} />
              <InfoCard label="Area" value={loanState.area} />
              <InfoCard label="Current address" value={loanState.currentAddress} className="sm:col-span-2" />
              <InfoCard label="Permanent address" value={loanState.permanentAddress} className="sm:col-span-2" />
              <InfoCard label="Aadhaar number" value={loanState.aadhaarNumber} />
              <InfoCard label="Supporting documents" value={`${loanState.supportingDocumentCount} attached`} />
            </div>
          </article>

          <article className="app-panel rounded-[30px] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Loan Snapshot</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Status" value={loanState.status} />
              <InfoCard label="Date" value={loanState.loanDate} />
              <InfoCard label="Loan type" value={loanState.loanType} />
              <InfoCard label="Scheme" value={loanState.schemeName} />
              <InfoCard label="Interest %" value={`${loanState.interestPercent.toFixed(2)}%`} />
              <InfoCard label="Total principal paid" value={formatCurrency(totalPrincipalPaid)} />
              <InfoCard label="Total interest paid" value={formatCurrency(totalInterestPaid)} />
              <InfoCard label="Outstanding loan" value={formatCurrency(outstandingLoan)} />
              <InfoCard label="Interest cleared upto today" value={interestCleared ? "Yes" : "No"} />
            </div>
            {loanState.jewelDetails?.length ? <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white"><table className="min-w-full border-collapse"><thead><tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]"><th className="px-4 py-3 font-semibold">Jewel Type</th><th className="px-4 py-3 font-semibold">Jewel wt.</th><th className="px-4 py-3 font-semibold">Stone wt.</th><th className="px-4 py-3 font-semibold">Gold wt.</th></tr></thead><tbody>{loanState.jewelDetails.map((row) => (<tr key={row.id} className="border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]"><td className="px-4 py-3">{row.jewelType}</td><td className="px-4 py-3">{row.jewelWeight}</td><td className="px-4 py-3">{row.stoneWeight}</td><td className="px-4 py-3">{row.goldWeight}</td></tr>))}</tbody></table></div> : null}
          </article>
        </section>

        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Payment History</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={openPaymentModal} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><HandCoins className="h-4 w-4 text-[var(--color-accent)]" />Make payment</button>
              <button type="button" onClick={() => openAdjustmentModal()} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><ClipboardPenLine className="h-4 w-4 text-[var(--color-accent)]" />Adjustment</button>
              <button type="button" onClick={openCloseLoanModal} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />Close loan</button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white pb-2">
            <table className="min-w-[1260px] border-collapse">
              <thead>
                <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Interest from</th>
                  <th className="px-4 py-3 font-semibold">Interest upto</th>
                  <th className="px-4 py-3 font-semibold">Principal payment</th>
                  <th className="px-4 py-3 font-semibold">Interest payment</th>
                  <th className="px-4 py-3 font-semibold">Net principal</th>
                  <th className="px-4 py-3 font-semibold">Net interest</th>
                  <th className="px-4 py-3 font-semibold">Adjustments</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {effectivePayments.length ? effectivePayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]">
                    <td className="px-4 py-3">{payment.paymentDate}</td>
                    <td className="px-4 py-3">{payment.effectivePaymentFrom}</td>
                    <td className="px-4 py-3">{payment.effectivePaymentUpto}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.principalPayment)}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.interestPayment)}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.netPrincipalPayment)}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.netInterestPayment)}</td>
                    <td className="px-4 py-3">{payment.adjustments.length ? <div className="space-y-1">{payment.adjustments.map((adjustment) => <p key={adjustment.id} className="text-xs leading-6">{adjustment.correctionType}: {formatAdjustmentDelta(adjustment.principalAdjustment)} / {formatAdjustmentDelta(adjustment.interestAdjustment)}</p>)}</div> : <span className="text-xs">No adjustment</span>}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => openAdjustmentModal(payment)} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><ClipboardPenLine className="h-3.5 w-3.5 text-[var(--color-accent)]" />Adjust</button></td>
                  </tr>
                )) : <tr><td colSpan={9} className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">No payments recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-center gap-3 text-[var(--color-accent)]">
            <ClipboardPenLine className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Adjustment Trail</p>
          </div>
          <div className="mt-6 grid gap-3">
            {adjustments.length ? adjustments.map((adjustment) => (
              <article key={adjustment.id} className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(150px,0.8fr)_minmax(160px,0.9fr)_minmax(1fr,1.4fr)_minmax(150px,0.8fr)] lg:items-center">
                  <Cell label="Posted on" value={adjustment.createdAt} subValue={adjustment.originalPaymentDate} />
                  <Cell label="Type" value={adjustment.correctionType} subValue={adjustment.status} strong />
                  <Cell label="Reason" value={adjustment.reason} subValue={`${formatAdjustmentDelta(adjustment.principalAdjustment)} principal / ${formatAdjustmentDelta(adjustment.interestAdjustment)} interest`} />
                  <Cell label="Acknowledged by" value={adjustment.acknowledgedBy} subValue={`${adjustment.correctedPaymentFrom} to ${adjustment.correctedPaymentUpto}`} />
                </div>
              </article>
            )) : <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-white px-5 py-8 text-center text-sm text-[var(--color-muted)]">No corrections have been posted for this loan yet.</div>}
          </div>
        </section>
      </div>

      {showPaymentModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4"><div className="w-full max-w-2xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Record Payment</p><h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{loanState.accountNumber}</h2></div><button type="button" onClick={closePaymentModal} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]" aria-label="Close payment popup"><X className="h-4 w-4" /></button></div><form onSubmit={handlePaymentSubmit} className="mt-6 space-y-5"><div className="grid gap-4 md:grid-cols-2"><MetricCard icon={<FileText className="h-4 w-4 text-[var(--color-accent)]" />} label="Original loan" value={formatCurrency(loanState.originalLoanAmount)} /><MetricCard icon={<HandCoins className="h-4 w-4 text-[var(--color-accent)]" />} label="Outstanding loan" value={formatCurrency(outstandingLoan)} /></div><div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Payment date</span><input type="date" value={paymentDraft.paymentDate} onChange={(event) => handleDraftChange("paymentDate", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Principal payment</span><input value={paymentDraft.principalPayment} onChange={(event) => handleDraftChange("principalPayment", event.target.value)} placeholder="0" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest payment from</span><input type="date" value={paymentDraft.paymentFrom} onChange={(event) => handleDraftChange("paymentFrom", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest payment upto</span><input type="date" value={paymentDraft.paymentUpto} onChange={(event) => handleDraftChange("paymentUpto", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest payment</span><input value={paymentDraft.interestPayment} onChange={(event) => handleDraftChange("interestPayment", event.target.value)} placeholder="0" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Remarks</span><textarea value={paymentDraft.notes} onChange={(event) => handleDraftChange("notes", event.target.value)} rows={3} placeholder="Optional note for this payment" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]"><CalendarClock className="h-4 w-4 text-[var(--color-accent)]" />Principal payment reduces the outstanding loan immediately.</div><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><Save className="h-4 w-4" />Save payment</button></div></form></div></div> : null}

      {showAdjustmentModal && selectedPayment && adjustmentDraft ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4"><div className="w-full max-w-3xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Payment Correction</p><h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{loanState.accountNumber}</h2><p className="mt-2 text-sm text-[var(--color-muted)]">Original payment dated {selectedPayment.paymentDate} remains preserved.</p></div><button type="button" onClick={closeAdjustmentModal} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]" aria-label="Close adjustment popup"><X className="h-4 w-4" /></button></div><form onSubmit={handleAdjustmentSubmit} className="mt-6 space-y-5"><div className="grid gap-4 md:grid-cols-2"><MetricCard icon={<FileText className="h-4 w-4 text-[var(--color-accent)]" />} label="Original principal" value={formatCurrency(selectedPayment.principalPayment)} /><MetricCard icon={<FileText className="h-4 w-4 text-[var(--color-accent)]" />} label="Original interest" value={formatCurrency(selectedPayment.interestPayment)} /></div><div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Correction type</span><select value={adjustmentDraft.correctionType} onChange={(event) => handleAdjustmentDraftChange("correctionType", event.target.value as PaymentAdjustmentType)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"><option value="Full Reversal">Full reversal</option><option value="Partial Adjustment">Partial adjustment</option></select></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Acknowledged by</span><input value={adjustmentDraft.acknowledgedBy} onChange={(event) => handleAdjustmentDraftChange("acknowledgedBy", event.target.value)} placeholder="Staff / Admin name" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Principal adjustment</span><input value={adjustmentDraft.principalAdjustment} onChange={(event) => handleAdjustmentDraftChange("principalAdjustment", event.target.value)} placeholder="Use negative values for reversal" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest adjustment</span><input value={adjustmentDraft.interestAdjustment} onChange={(event) => handleAdjustmentDraftChange("interestAdjustment", event.target.value)} placeholder="Use negative values for reversal" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Corrected interest from</span><input type="date" value={adjustmentDraft.correctedPaymentFrom} onChange={(event) => handleAdjustmentDraftChange("correctedPaymentFrom", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Corrected interest upto</span><input type="date" value={adjustmentDraft.correctedPaymentUpto} onChange={(event) => handleAdjustmentDraftChange("correctedPaymentUpto", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Reason</span><textarea value={adjustmentDraft.reason} onChange={(event) => handleAdjustmentDraftChange("reason", event.target.value)} rows={4} placeholder="Mandatory reason for reversal or correction" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label></div><div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" /><p>The original payment entry will not be edited. This action posts a linked correction entry and the loan balances are recalculated from the net effect.</p></div></div><div className="flex justify-end"><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"><Save className="h-4 w-4" />Post adjustment</button></div></form></div></div> : null}

      {showCloseLoanModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4"><div className="w-full max-w-xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Close Loan</p><h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{loanState.accountNumber}</h2></div><button type="button" onClick={closeCloseLoanModal} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]" aria-label="Close loan popup"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><MetricCard icon={<HandCoins className="h-4 w-4 text-[var(--color-accent)]" />} label="Outstanding loan" value={formatCurrency(outstandingLoan)} /><MetricCard icon={<CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />} label="Interest cleared upto today" value={interestCleared ? "Yes" : "No"} /></div><div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-muted)]"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" /><p>Loan closure is allowed only when the full principal amount is paid and interest is cleared up to today.</p></div></div><label className="mt-5 flex items-start gap-3 rounded-[24px] border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-ink)]"><input type="checkbox" checked={closeAcknowledged} onChange={(event) => setCloseAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-[var(--color-border)]" /><span>I confirm that the full principal amount and upto date interest have been collected and verified.</span></label><div className="mt-6 flex justify-end"><button type="button" disabled={isSubmitting} onClick={handleCloseLoan} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><CheckCircle2 className="h-4 w-4" />Confirm close</button></div></div></div> : null}
    </>
  );
}

function InfoCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 ${className}`}><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{value}</p></div>;
}

function MetricCard({ icon, label, value }: { icon: import("react").ReactNode; label: string; value: string }) {
  return <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{icon}<span>{label}</span></div><p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{value}</p></div>;
}

function Cell({ label, value, subValue, strong = false }: { label: string; value: string; subValue?: string; strong?: boolean }) {
  return <div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p><p className={strong ? "text-sm font-semibold leading-7 text-[var(--color-ink)]" : "text-sm leading-7 text-[var(--color-muted)]"}>{value}</p>{subValue ? <p className="mt-1 text-xs text-[var(--color-muted)]">{subValue}</p> : null}</div>;
}
