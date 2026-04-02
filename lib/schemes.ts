import { calculateSimpleInterestForRange } from "@/lib/date-utils";

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

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeSchemeSlabs(scheme: LoanScheme | null | undefined) {
  return (scheme?.slabs ?? [])
    .map((slab) => ({
      startDay: toNumber(slab.startDay),
      endDay: slab.endDay === "" ? null : toNumber(slab.endDay),
      interestPercent: toNumber(slab.interestPercent),
    }))
    .filter((slab) => slab.startDay > 0 && slab.interestPercent > 0)
    .sort((a, b) => a.startDay - b.startDay);
}

export function resolveSchemeInterestPercent(scheme: LoanScheme | null | undefined, days: number) {
  if (!scheme || days <= 0) {
    return null;
  }

  const slabs = normalizeSchemeSlabs(scheme);
  const matched = slabs.find((slab) => days >= slab.startDay && (slab.endDay == null || days <= slab.endDay));
  return matched?.interestPercent ?? null;
}

export function calculateSchemeInterestForRange(
  principal: number,
  scheme: LoanScheme | null | undefined,
  fromValue: string,
  uptoValue: string,
) {
  const preview = calculateSimpleInterestForRange(principal, 1, fromValue, uptoValue);
  const resolvedPercent = resolveSchemeInterestPercent(scheme, preview.days);

  if (!resolvedPercent) {
    return {
      amount: 0,
      days: preview.days,
      interestPercent: 0,
    };
  }

  const result = calculateSimpleInterestForRange(principal, resolvedPercent, fromValue, uptoValue);
  return {
    amount: result.amount,
    days: result.days,
    interestPercent: resolvedPercent,
  };
}
