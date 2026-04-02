import { parseAppDate } from "@/lib/date-utils";
import { getLoanPrefixByCompanyName } from "@/lib/companies";

export function getFinancialYearPrefix(value: string) {
  const date = parseAppDate(value);
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function getLoanAccountSeriesPrefix(companyName: string, loanDate: string) {
  return `${getFinancialYearPrefix(loanDate)}/${getLoanPrefixByCompanyName(companyName)}`;
}

export function buildLoanAccountNumber(companyName: string, loanDate: string, sequence: number) {
  return `${getLoanAccountSeriesPrefix(companyName, loanDate)}-${sequence}`;
}

export function parseLoanAccountNumber(accountNumber: string) {
  const match = accountNumber.trim().match(/^(\d{4})-(\d{4})\/([A-Z]{2,6})-(\d+)$/);

  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  const companyPrefix = match[3];
  const sequence = Number(match[4]);

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || !Number.isFinite(sequence) || endYear !== startYear + 1) {
    return null;
  }

  return {
    financialYearStart: startYear,
    financialYearLabel: `${startYear}-${endYear}`,
    companyPrefix,
    seriesPrefix: `${startYear}-${endYear}/${companyPrefix}`,
    sequence,
  };
}

export function buildHighestSequenceMap(numbers: string[]) {
  return numbers.reduce<Record<string, number>>((acc, entry) => {
    const parsed = parseLoanAccountNumber(entry);
    if (parsed) {
      acc[parsed.seriesPrefix] = Math.max(acc[parsed.seriesPrefix] ?? 0, parsed.sequence);
    }
    return acc;
  }, {});
}

export function getSequenceFromAccountNumber(value: string, expectedSeriesPrefix: string) {
  const parsed = parseLoanAccountNumber(value);
  if (!parsed || parsed.seriesPrefix !== expectedSeriesPrefix) {
    return null;
  }

  return parsed.sequence;
}