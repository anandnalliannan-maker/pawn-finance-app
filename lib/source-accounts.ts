export const sourceAccounts = [
  "Cash in Hand",
  "Bank Account",
  "Petty Cash",
  "Owner Funds",
  "Inter-branch Transfer",
] as const;

export type SourceAccount = (typeof sourceAccounts)[number];

export function isSourceAccount(value: string): value is SourceAccount {
  return sourceAccounts.includes(value as SourceAccount);
}
