export type SchemeSlab = {
  id: string;
  startDay: string;
  endDay: string;
  interestPercent: string;
};

export type LoanScheme = {
  id: string;
  code?: string;
  name: string;
  company: string;
  slabs: SchemeSlab[];
};

export type SaveLoanSchemePayload = {
  id?: string;
  companyName: string;
  code?: string;
  name: string;
  slabs: Array<{
    startDay: number;
    endDay?: number | null;
    interestPercent: number;
  }>;
};
