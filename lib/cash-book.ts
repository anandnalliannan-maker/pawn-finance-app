export type CashBookDayRecord = {
  id: string;
  company: string;
  companyId: string;
  bookDate: string;
  openingBalance: number;
  totalIncoming: number;
  totalOutgoing: number;
  expectedClosingBalance: number;
  cashInHand: number;
  reconciliationDifference: number;
  status: "Balanced" | "Excess" | "Shortage";
  remarks: string;
};
