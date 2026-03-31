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
  {
    id: "led-8",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Town Office",
    category: "Incoming Payment",
    direction: "Incoming",
    description: "Interest received from loan 2025-2026/211",
    reference: "Karthik R",
    amount: 820,
  },
  {
    id: "led-9",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Town Office",
    category: "Tea",
    direction: "Outgoing",
    description: "Customer waiting tea",
    reference: "Town Corner Tea Shop",
    amount: 120,
  },
  {
    id: "led-10",
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Gold Unit",
    category: "Outgoing Loan",
    direction: "Outgoing",
    description: "Jewel loan disbursed for account 2025-2026/310",
    reference: "Divya N",
    amount: 68000,
  },
  {
    id: "led-11",
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Gold Unit",
    category: "Deposit Received",
    direction: "Incoming",
    description: "Short term business funding received",
    reference: "MKS Finance",
    amount: 150000,
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
  {
    id: "vou-4",
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Town Office",
    category: "Tea",
    payee: "Town Corner Tea Shop",
    remarks: "Tea for walk-in depositors",
    amount: 120,
  },
  {
    id: "vou-5",
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Gold Unit",
    category: "Fuel",
    payee: "Indian Oil",
    remarks: "Field valuation travel",
    amount: 540,
  },
];
