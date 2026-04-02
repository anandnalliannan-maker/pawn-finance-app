export const companyOptions = [
  {
    name: "Vishnu Bankers",
    code: "VB001",
    loanPrefix: "VF",
  },
  {
    name: "Arya Finance",
    code: "AF001",
    loanPrefix: "AF",
  },
  {
    name: "Sai Credits",
    code: "SC001",
    loanPrefix: "SC",
  },
] as const;

export const defaultCompanyName = companyOptions[0].name;

export function matchesCompanyFilter(company: string, companyFilter: string) {
  return !companyFilter || company === companyFilter;
}

export function getLoanPrefixByCompanyName(companyName: string) {
  return companyOptions.find((company) => company.name === companyName)?.loanPrefix ?? "LN";
}