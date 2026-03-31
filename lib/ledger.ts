export type LedgerCategory =
  | "Incoming Payment"
  | "Outgoing Loan"
  | "Deposit Received"
  | "Tea"
  | "Snacks"
  | "Fuel"
  | "Salary"
  | "Miscellaneous";

export type TransactionDirection = "Incoming" | "Outgoing";

export type LedgerEntry = {
  id: string;
  date: string;
  company: string;
  category: LedgerCategory;
  direction: TransactionDirection;
  description: string;
  reference: string;
  amount: number;
};

export type VoucherEntry = {
  id: string;
  date: string;
  company: string;
  category: Extract<LedgerCategory, "Tea" | "Snacks" | "Fuel" | "Salary" | "Miscellaneous">;
  payee: string;
  remarks: string;
  amount: number;
};

export const voucherCategories: VoucherEntry["category"][] = [
  "Tea",
  "Snacks",
  "Fuel",
  "Salary",
  "Miscellaneous",
];

export const ledgerEntries: LedgerEntry[] = [
  {
    id: "led-1",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Incoming Payment",
    direction: "Incoming",
    description: "Interest received from loan 2025-2026/108",
    reference: "Priya S",
    amount: 1050,
  },
  {
    id: "led-2",
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Outgoing Loan",
    direction: "Outgoing",
    description: "Cash loan disbursed for account 2025-2026/110",
    reference: "Meena V",
    amount: 92000,
  },
  {
    id: "led-3",
    date: "28-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Deposit Received",
    direction: "Incoming",
    description: "Business deposit received",
    reference: "Anitha S",
    amount: 95000,
  },
  {
    id: "led-4",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Tea",
    direction: "Outgoing",
    description: "Evening staff tea",
    reference: "Murugan Tea Stall",
    amount: 180,
  },
  {
    id: "led-5",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Snacks",
    direction: "Outgoing",
    description: "Branch meeting snacks",
    reference: "Sree Bakery",
    amount: 420,
  },
  {
    id: "led-6",
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Fuel",
    direction: "Outgoing",
    description: "Bike fuel for field collection",
    reference: "Indian Oil",
    amount: 600,
  },
  {
    id: "led-7",
    date: "29-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Salary",
    direction: "Outgoing",
    description: "Monthly staff salary payout",
    reference: "March payroll",
    amount: 38000,
  },
];

export const voucherEntries: VoucherEntry[] = [
  {
    id: "vou-1",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Tea",
    payee: "Murugan Tea Stall",
    remarks: "Evening tea for branch staff",
    amount: 180,
  },
  {
    id: "vou-2",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Snacks",
    payee: "Sree Bakery",
    remarks: "Snacks for customer meeting",
    amount: 420,
  },
  {
    id: "vou-3",
    date: "29-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    category: "Salary",
    payee: "Branch Staff",
    remarks: "March salary payment",
    amount: 38000,
  },
];
