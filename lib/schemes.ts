export type SchemeSlab = {
  id: number;
  startDay: string;
  endDay: string;
  interestPercent: string;
};

export type LoanScheme = {
  id: string;
  name: string;
  slabs: SchemeSlab[];
};

export const loanSchemes: LoanScheme[] = [
  {
    id: "scheme_daily",
    name: "Daily",
    slabs: [
      { id: 1, startDay: "1", endDay: "30", interestPercent: "1.00" },
      { id: 2, startDay: "31", endDay: "60", interestPercent: "2.50" },
    ],
  },
  {
    id: "scheme_standard",
    name: "Standard",
    slabs: [
      { id: 1, startDay: "1", endDay: "30", interestPercent: "1.00" },
      { id: 2, startDay: "31", endDay: "45", interestPercent: "2.00" },
    ],
  },
  {
    id: "scheme_premium_jewel",
    name: "Premium Jewel",
    slabs: [
      { id: 1, startDay: "1", endDay: "30", interestPercent: "1.50" },
      { id: 2, startDay: "31", endDay: "60", interestPercent: "2.25" },
    ],
  },
];
