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

export const previewDeposits: DepositRecord[] = [
  {
    id: "deposit-2025-001",
    depositorCode: "200101",
    depositorName: "Siva Finance",
    phoneNumber: "+91 96000 22331",
    address: "15, Bazaar Street, Coimbatore",
    reference: "Raghu",
    company: "Vishnu Bankers - Main Branch",
    depositDate: "10-Mar-2026",
    depositAmount: 250000,
    interestPercent: 1.25,
    attachmentCount: 2,
    status: "Active",
    payments: [
      {
        id: "dep-pay-1",
        paymentDate: "05-Apr-2026",
        paymentFrom: "10-Mar-2026",
        paymentUpto: "05-Apr-2026",
        principalPayment: 25000,
        interestPayment: 3125,
      },
    ],
  },
  {
    id: "deposit-2025-002",
    depositorCode: "200102",
    depositorName: "Lakshmi Traders",
    phoneNumber: "+91 98941 77554",
    address: "8, Rice Mill Road, Pollachi",
    reference: "Murugan",
    company: "Vishnu Bankers - Main Branch",
    depositDate: "18-Feb-2026",
    depositAmount: 180000,
    interestPercent: 1,
    attachmentCount: 1,
    status: "Closed",
    payments: [
      {
        id: "dep-pay-2",
        paymentDate: "18-Mar-2026",
        paymentFrom: "18-Feb-2026",
        paymentUpto: "18-Mar-2026",
        principalPayment: 90000,
        interestPayment: 1800,
      },
      {
        id: "dep-pay-3",
        paymentDate: "28-Mar-2026",
        paymentFrom: "19-Mar-2026",
        paymentUpto: "28-Mar-2026",
        principalPayment: 90000,
        interestPayment: 900,
      },
    ],
  },
  {
    id: "deposit-2025-003",
    depositorCode: "200103",
    depositorName: "Anitha S",
    phoneNumber: "+91 97876 11009",
    address: "12, Lake View Colony, Tiruppur",
    reference: "Self",
    company: "Vishnu Bankers - Main Branch",
    depositDate: "28-Mar-2026",
    depositAmount: 95000,
    interestPercent: 1.5,
    attachmentCount: 3,
    status: "Active",
    payments: [],
  },
  {
    id: "deposit-2025-004",
    depositorCode: "200104",
    depositorName: "Town Benefit Funds",
    phoneNumber: "+91 97876 99110",
    address: "2, Raja Street, Town Hall",
    reference: "Logesh",
    company: "Vishnu Bankers - Town Office",
    depositDate: "29-Mar-2026",
    depositAmount: 120000,
    interestPercent: 1.1,
    attachmentCount: 1,
    status: "Active",
    payments: [],
  },
  {
    id: "deposit-2025-005",
    depositorCode: "200105",
    depositorName: "MKS Finance",
    phoneNumber: "+91 94422 77114",
    address: "18, Jewel Complex, Tiruppur",
    reference: "Suresh",
    company: "Vishnu Bankers - Gold Unit",
    depositDate: "30-Mar-2026",
    depositAmount: 150000,
    interestPercent: 1.35,
    attachmentCount: 2,
    status: "Active",
    payments: [],
  },
];

export function getOutstandingDepositAmount(deposit: DepositRecord) {
  const principalPaid = deposit.payments.reduce(
    (total, payment) => total + payment.principalPayment,
    0,
  );
  return Math.max(deposit.depositAmount - principalPaid, 0);
}

export function getDepositById(depositId: string) {
  return previewDeposits.find((deposit) => deposit.id === depositId);
}
