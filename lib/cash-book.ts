export type CashBookBalance = {
  date: string;
  company: string;
  openingBalance: number;
  openingNote?: string;
};

export const cashBookOpeningBalances: CashBookBalance[] = [
  {
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    openingBalance: 125000,
    openingNote: "Balance carried forward from previous day close",
  },
  {
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    openingBalance: 158000,
    openingNote: "Cash available at branch opening",
  },
  {
    date: "29-Mar-2026",
    company: "Vishnu Bankers - Main Branch",
    openingBalance: 171500,
    openingNote: "Sunday carry forward",
  },
  {
    date: "31-Mar-2026",
    company: "Vishnu Bankers - Town Office",
    openingBalance: 64000,
    openingNote: "Town office opening cash",
  },
  {
    date: "30-Mar-2026",
    company: "Vishnu Bankers - Gold Unit",
    openingBalance: 91000,
    openingNote: "Gold unit opening balance before new disbursals",
  },
];
