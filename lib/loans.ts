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
  id: number;
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

export const previewLoans: LoanRecord[] = [
  {
    id: "loan-2025-2026-108",
    accountNumber: "2025-2026/108",
    customerCode: "102344",
    customerName: "Priya S",
    phoneNumber: "+91 98400 12345",
    customerPhotoLabel: "PS",
    currentAddress: "12, Market Road, Gandhipuram",
    permanentAddress: "12, Market Road, Gandhipuram",
    aadhaarNumber: "4587 9987 1120",
    area: "Gandhipuram",
    loanType: "Jewel Loan",
    company: "Vishnu Bankers - Main Branch",
    loanDate: "30-Mar-2026",
    schemeName: "Premium Jewel",
    interestPercent: 1.5,
    originalLoanAmount: 75000,
    supportingDocumentCount: 2,
    status: "Active",
    jewelDetails: [
      {
        id: 1,
        jewelType: "Necklace",
        jewelWeight: "42.200",
        stoneWeight: "3.300",
        goldWeight: "38.900",
      },
      {
        id: 2,
        jewelType: "Bangle",
        jewelWeight: "18.500",
        stoneWeight: "0.500",
        goldWeight: "18.000",
      },
    ],
    payments: [
      {
        id: "pay-108-1",
        paymentDate: "12-Apr-2026",
        paymentFrom: "30-Mar-2026",
        paymentUpto: "12-Apr-2026",
        principalPayment: 5000,
        interestPayment: 1125,
      },
      {
        id: "pay-108-2",
        paymentDate: "01-May-2026",
        paymentFrom: "13-Apr-2026",
        paymentUpto: "30-Apr-2026",
        principalPayment: 0,
        interestPayment: 1050,
      },
    ],
  },
  {
    id: "loan-2025-2026-109",
    accountNumber: "2025-2026/109",
    customerCode: "102198",
    customerName: "Ramesh K",
    phoneNumber: "+91 98940 55123",
    customerPhotoLabel: "RK",
    currentAddress: "4, New Street, Pollachi",
    permanentAddress: "4, New Street, Pollachi",
    aadhaarNumber: "8876 5523 1098",
    area: "Pollachi",
    loanType: "Cash Loan",
    company: "Vishnu Bankers - Main Branch",
    loanDate: "20-Feb-2026",
    schemeName: "Standard",
    interestPercent: 1,
    originalLoanAmount: 50000,
    supportingDocumentCount: 1,
    status: "Closed",
    payments: [
      {
        id: "pay-109-1",
        paymentDate: "20-Mar-2026",
        paymentFrom: "20-Feb-2026",
        paymentUpto: "20-Mar-2026",
        principalPayment: 25000,
        interestPayment: 500,
      },
      {
        id: "pay-109-2",
        paymentDate: "27-Mar-2026",
        paymentFrom: "21-Mar-2026",
        paymentUpto: "27-Mar-2026",
        principalPayment: 25000,
        interestPayment: 250,
      },
    ],
  },
  {
    id: "loan-2025-2026-110",
    accountNumber: "2025-2026/110",
    customerCode: "102145",
    customerName: "Meena V",
    phoneNumber: "+91 97890 44002",
    customerPhotoLabel: "MV",
    currentAddress: "22, Mill Road, Tiruppur",
    permanentAddress: "22, Mill Road, Tiruppur",
    aadhaarNumber: "7744 6622 1144",
    area: "Tiruppur",
    loanType: "Jewel Loan",
    company: "Vishnu Bankers - Main Branch",
    loanDate: "28-Mar-2026",
    schemeName: "Daily",
    interestPercent: 1,
    originalLoanAmount: 92000,
    supportingDocumentCount: 3,
    status: "Active",
    jewelDetails: [
      {
        id: 1,
        jewelType: "Chain",
        jewelWeight: "28.100",
        stoneWeight: "1.100",
        goldWeight: "27.000",
      },
    ],
    payments: [],
  },
  {
    id: "loan-2025-2026-211",
    accountNumber: "2025-2026/211",
    customerCode: "103210",
    customerName: "Karthik R",
    phoneNumber: "+91 93450 22018",
    customerPhotoLabel: "KR",
    currentAddress: "7, Temple Road, Town Hall",
    permanentAddress: "7, Temple Road, Town Hall",
    aadhaarNumber: "6655 2200 1901",
    area: "Town Hall",
    loanType: "Cash Loan",
    company: "Vishnu Bankers - Town Office",
    loanDate: "31-Mar-2026",
    schemeName: "Standard",
    interestPercent: 1.25,
    originalLoanAmount: 40000,
    supportingDocumentCount: 1,
    status: "Active",
    payments: [
      {
        id: "pay-211-1",
        paymentDate: "05-Apr-2026",
        paymentFrom: "31-Mar-2026",
        paymentUpto: "05-Apr-2026",
        principalPayment: 0,
        interestPayment: 820,
      },
    ],
  },
  {
    id: "loan-2025-2026-310",
    accountNumber: "2025-2026/310",
    customerCode: "104011",
    customerName: "Divya N",
    phoneNumber: "+91 94433 90902",
    customerPhotoLabel: "DN",
    currentAddress: "5, Goldsmith Lane, Tiruppur",
    permanentAddress: "5, Goldsmith Lane, Tiruppur",
    aadhaarNumber: "9090 1122 7744",
    area: "Goldsmith Lane",
    loanType: "Jewel Loan",
    company: "Vishnu Bankers - Gold Unit",
    loanDate: "30-Mar-2026",
    schemeName: "Premium Jewel",
    interestPercent: 1.75,
    originalLoanAmount: 68000,
    supportingDocumentCount: 2,
    status: "Active",
    jewelDetails: [
      {
        id: 1,
        jewelType: "Ring Set",
        jewelWeight: "20.450",
        stoneWeight: "1.250",
        goldWeight: "19.200",
      },
    ],
    payments: [],
  },
];

export function getOutstandingLoanAmount(loan: LoanRecord) {
  const principalPaid = loan.payments.reduce(
    (total, payment) => total + payment.principalPayment,
    0,
  );
  return Math.max(loan.originalLoanAmount - principalPaid, 0);
}

export function getLoanById(loanId: string) {
  return previewLoans.find((loan) => loan.id === loanId);
}
