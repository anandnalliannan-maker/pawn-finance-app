export type DepositStatus = "Active" | "Closed";

export type DepositPaymentRecord = {
  id: string;
  paymentDate: string;
  paymentFrom: string;
  paymentUpto: string;
  principalPayment: number;
  interestPayment: number;
  notes?: string;
};

export type DepositRecord = {
  id: string;
  depositorCode: string;
  depositorName: string;
  phoneNumber: string;
  address: string;
  reference: string;
  company: string;
  depositDate: string;
  depositAmount: number;
  interestPercent: number;
  attachmentCount: number;
  status: DepositStatus;
  payments: DepositPaymentRecord[];
};

export type CreateDepositPayload = {
  companyName: string;
  depositorName: string;
  phoneNumber: string;
  address?: string;
  reference?: string;
  depositDate: string;
  depositAmount: number;
  interestPercent: number;
  supportingDocuments?: string[];
};

export function getOutstandingDepositAmount(deposit: DepositRecord) {
  const principalPaid = deposit.payments.reduce(
    (total, payment) => total + payment.principalPayment,
    0,
  );
  return Math.max(deposit.depositAmount - principalPaid, 0);
}
