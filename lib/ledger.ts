export type LedgerCategory =
  | "Incoming Payment"
  | "Outgoing Loan"
  | "Deposit Received"
  | "Deposit Payout"
  | "Payment Adjustment"
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

export type VoucherCategory = Extract<
  LedgerCategory,
  "Tea" | "Snacks" | "Fuel" | "Salary" | "Miscellaneous"
>;

export type VoucherEntry = {
  id: string;
  date: string;
  company: string;
  category: VoucherCategory;
  payee: string;
  remarks: string;
  amount: number;
  attachmentCount: number;
};

export const voucherCategories: VoucherCategory[] = [
  "Tea",
  "Snacks",
  "Fuel",
  "Salary",
  "Miscellaneous",
];

export const ledgerCategories: Array<LedgerCategory | "All"> = [
  "All",
  "Incoming Payment",
  "Outgoing Loan",
  "Deposit Received",
  "Deposit Payout",
  "Payment Adjustment",
  "Tea",
  "Snacks",
  "Fuel",
  "Salary",
  "Miscellaneous",
];
