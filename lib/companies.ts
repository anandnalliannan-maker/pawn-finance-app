export const companyOptions = [
  {
    name: "Vishnu Bankers",
    code: "VB001",
  },
  {
    name: "Arya Finance",
    code: "AF001",
  },
  {
    name: "Sai Credits",
    code: "SC001",
  },
] as const;

export const defaultCompanyName = companyOptions[0].name;

export function matchesCompanyFilter(company: string, companyFilter: string) {
  return !companyFilter || company === companyFilter;
}
