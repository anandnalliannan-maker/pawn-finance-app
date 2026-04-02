export const fundSourceTypes = [
  "Owner Capital",
  "Partner Capital",
  "Bank Withdrawal",
  "Inter-branch Transfer",
  "Other Funds",
] as const;

export type FundSourceType = (typeof fundSourceTypes)[number];

export type FundsInRecord = {
  id: string;
  date: string;
  company: string;
  sourceType: FundSourceType;
  receivedFrom: string;
  amount: number;
  account: string;
  remarks: string;
  attachmentCount: number;
};

export type CreateFundsInPayload = {
  companyName: string;
  entryDate: string;
  sourceType: FundSourceType;
  receivedFrom: string;
  amount: number;
  account: string;
  remarks?: string;
  supportingDocuments?: string[];
};
