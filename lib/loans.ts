export type LoanStatus = "Active" | "Closed";

export type LoanPaymentRecord = {
  id: string;
  paymentDate: string;
  paymentFrom: string;
  paymentUpto: string;
  principalPayment: number;
  interestPayment: number;
  notes?: string;
};

export type JewelDetail = {
  id: string;
  jewelType: string;
  jewelWeight: string;
  stoneWeight: string;
  goldWeight: string;
};

export type LoanRecord = {
  id: string;
  accountNumber: string;
  customerCode: string;
  customerName: string;
  phoneNumber: string;
  customerPhotoLabel: string;
  currentAddress: string;
  permanentAddress: string;
  aadhaarNumber: string;
  area: string;
  loanType: "Cash Loan" | "Jewel Loan";
  company: string;
  loanDate: string;
  schemeName: string;
  interestPercent: number;
  originalLoanAmount: number;
  supportingDocumentCount: number;
  status: LoanStatus;
  jewelDetails?: JewelDetail[];
  payments: LoanPaymentRecord[];
};

export type CreateLoanPayload = {
  companyName: string;
  customerId: string;
  accountNumber: string;
  loanDate: string;
  loanType: "cash_loan" | "jewel_loan";
  loanAmount: number;
  schemeName?: string;
  interestPercent: number;
  supportingDocuments?: string[];
  jewelItems?: Array<{
    jewelType: string;
    jewelWeight: number;
    stoneWeight: number;
  }>;
};

export type RecordLoanPaymentPayload = {
  paymentDate: string;
  paymentFrom: string;
  paymentUpto: string;
  principalPayment: number;
  interestPayment: number;
  notes?: string;
};

export function getOutstandingLoanAmount(loan: LoanRecord) {
  const principalPaid = loan.payments.reduce(
    (total, payment) => total + payment.principalPayment,
    0,
  );
  return Math.max(loan.originalLoanAmount - principalPaid, 0);
}
