import { formatDisplayDate, parseAppDate } from "@/lib/date-utils";
import type { LoanPaymentRecord } from "@/lib/loans";

export type PaymentAdjustmentType = "Full Reversal" | "Partial Adjustment";

export type PaymentAdjustmentRecord = {
  id: string;
  loanId: string;
  loanAccountNumber: string;
  company: string;
  customerName: string;
  originalPaymentId: string;
  originalPaymentDate: string;
  correctionType: PaymentAdjustmentType;
  principalAdjustment: number;
  interestAdjustment: number;
  correctedPaymentFrom: string;
  correctedPaymentUpto: string;
  reason: string;
  acknowledgedBy: string;
  createdAt: string;
  status: "Posted";
};

export type EffectiveLoanPaymentRecord = LoanPaymentRecord & {
  effectivePaymentFrom: string;
  effectivePaymentUpto: string;
  netPrincipalPayment: number;
  netInterestPayment: number;
  adjustments: PaymentAdjustmentRecord[];
};

export const previewPaymentAdjustments: PaymentAdjustmentRecord[] = [
  {
    id: "adj-109-1",
    loanId: "loan-2025-2026-109",
    loanAccountNumber: "2025-2026/109",
    company: "Vishnu Bankers - Main Branch",
    customerName: "Ramesh K",
    originalPaymentId: "pay-109-1",
    originalPaymentDate: "20-Mar-2026",
    correctionType: "Partial Adjustment",
    principalAdjustment: -5000,
    interestAdjustment: 0,
    correctedPaymentFrom: "20-Feb-2026",
    correctedPaymentUpto: "20-Mar-2026",
    reason: "Principal was entered higher than the cash actually received.",
    acknowledgedBy: "Admin",
    createdAt: "31-Mar-2026",
    status: "Posted",
  },
];

const STORAGE_KEY = "pawn-finance-payment-adjustments";

export function loadPaymentAdjustments() {
  if (typeof window === "undefined") {
    return previewPaymentAdjustments;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return previewPaymentAdjustments;
  }

  try {
    const parsed = JSON.parse(raw) as PaymentAdjustmentRecord[];
    return parsed.length ? parsed : previewPaymentAdjustments;
  } catch {
    return previewPaymentAdjustments;
  }
}

export function savePaymentAdjustments(adjustments: PaymentAdjustmentRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
}

export function getPaymentAdjustmentsForLoan(loanId: string, adjustments: PaymentAdjustmentRecord[]) {
  return adjustments.filter((adjustment) => adjustment.loanId === loanId);
}

export function buildEffectiveLoanPayments(
  payments: LoanPaymentRecord[],
  adjustments: PaymentAdjustmentRecord[],
): EffectiveLoanPaymentRecord[] {
  return payments.map((payment) => {
    const relatedAdjustments = adjustments.filter(
      (adjustment) => adjustment.originalPaymentId === payment.id,
    );
    const principalAdjustment = relatedAdjustments.reduce(
      (total, adjustment) => total + adjustment.principalAdjustment,
      0,
    );
    const interestAdjustment = relatedAdjustments.reduce(
      (total, adjustment) => total + adjustment.interestAdjustment,
      0,
    );
    const latestCorrection = [...relatedAdjustments]
      .sort((left, right) => parseAppDate(left.createdAt).getTime() - parseAppDate(right.createdAt).getTime())
      .at(-1);

    return {
      ...payment,
      effectivePaymentFrom: latestCorrection?.correctedPaymentFrom || payment.paymentFrom,
      effectivePaymentUpto: latestCorrection?.correctedPaymentUpto || payment.paymentUpto,
      netPrincipalPayment: Math.max(payment.principalPayment + principalAdjustment, 0),
      netInterestPayment: Math.max(payment.interestPayment + interestAdjustment, 0),
      adjustments: relatedAdjustments,
    };
  });
}

export function getAdjustedOutstandingLoanAmount(
  originalLoanAmount: number,
  payments: LoanPaymentRecord[],
  adjustments: PaymentAdjustmentRecord[],
) {
  const totalPrincipalPaid = buildEffectiveLoanPayments(payments, adjustments).reduce(
    (total, payment) => total + payment.netPrincipalPayment,
    0,
  );
  return Math.max(originalLoanAmount - totalPrincipalPaid, 0);
}

export function isInterestPaidUptoDateFromEffectivePayments(
  payments: EffectiveLoanPaymentRecord[],
) {
  const latestCoveredDate = payments
    .map((payment) => parseAppDate(payment.effectivePaymentUpto))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime())
    .at(-1);

  if (!latestCoveredDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return latestCoveredDate >= today;
}

export function formatAdjustmentDelta(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}Rs ${value.toFixed(2)}`;
}

export function buildFullReversalDraft(payment: LoanPaymentRecord) {
  return {
    principalAdjustment: String(-payment.principalPayment),
    interestAdjustment: String(-payment.interestPayment),
    correctedPaymentFrom: payment.paymentFrom,
    correctedPaymentUpto: payment.paymentUpto,
  };
}

export function todayDisplayDate() {
  return formatDisplayDate(new Date());
}
