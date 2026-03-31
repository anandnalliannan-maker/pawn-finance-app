export const companyOptions = [
  {
    name: "Vishnu Bankers - Main Branch",
    code: "VBM001",
  },
  {
    name: "Vishnu Bankers - Town Office",
    code: "VBT002",
  },
  {
    name: "Vishnu Bankers - Gold Unit",
    code: "VBG003",
  },
] as const;

export function matchesCompanyFilter(company: string, companyFilter: string) {
  return !companyFilter || company === companyFilter;
}
