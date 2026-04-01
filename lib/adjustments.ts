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

export type CreatePaymentAdjustmentPayload = {
  originalPaymentId: string;
  correctionType: PaymentAdjustmentType;
  principalAdjustment: number;
  interestAdjustment: number;
  correctedPaymentFrom: string;
  correctedPaymentUpto: string;
  reason: string;
  acknowledgedBy: string;
};

export type EffectiveLoanPaymentRecord = LoanPaymentRecord & {
  effectivePaymentFrom: string;
  effectivePaymentUpto: string;
  netPrincipalPayment: number;
  netInterestPayment: number;
  adjustments: PaymentAdjustmentRecord[];
};

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
      netPrincipalPayment: payment.principalPayment + principalAdjustment,
      netInterestPayment: payment.interestPayment + interestAdjustment,
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

