export function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
}

export function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseAppDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  const [day, month, year] = value.split("-");
  if (!day || !month || !year) {
    return new Date(NaN);
  }

  return new Date(`${day} ${month} ${year}`);
}

export function toDisplayDateFromIso(value: string) {
  if (!value) {
    return "";
  }

  const parsed = parseAppDate(value);
  return Number.isNaN(parsed.getTime()) ? "" : formatDisplayDate(parsed);
}

export function toIsoDateFromDisplay(value: string) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = parseAppDate(value);
  return Number.isNaN(parsed.getTime()) ? "" : formatIsoDate(parsed);
}

export function isDateWithinRange(value: string, fromDate: string, toDate: string) {
  const target = parseAppDate(value);
  if (Number.isNaN(target.getTime())) {
    return false;
  }

  if (fromDate) {
    const from = parseAppDate(fromDate);
    if (!Number.isNaN(from.getTime()) && target < from) {
      return false;
    }
  }

  if (toDate) {
    const to = parseAppDate(toDate);
    if (!Number.isNaN(to.getTime()) && target > to) {
      return false;
    }
  }

  return true;
}

export function getDaysInMonth(value: string | Date) {
  const date = typeof value === "string" ? parseAppDate(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function calculateSimpleInterestForRange(
  principal: number,
  monthlyInterestPercent: number,
  fromValue: string,
  uptoValue: string,
) {
  const fromDate = parseAppDate(fromValue);
  const uptoDate = parseAppDate(uptoValue);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(uptoDate.getTime()) ||
    principal <= 0 ||
    monthlyInterestPercent <= 0 ||
    uptoDate < fromDate
  ) {
    return { amount: 0, days: 0 };
  }

  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(uptoDate);
  end.setHours(0, 0, 0, 0);

  let totalInterest = 0;
  let totalDays = 0;

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(0, 0, 0, 0);
    const segmentEnd = monthEnd < end ? monthEnd : end;
    const daysInThisMonth = getDaysInMonth(cursor);
    const coveredDays = Math.floor((segmentEnd.getTime() - cursor.getTime()) / 86400000) + 1;

    totalInterest += (principal * (monthlyInterestPercent / 100) * coveredDays) / daysInThisMonth;
    totalDays += coveredDays;

    cursor.setMonth(cursor.getMonth() + 1, 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return {
    amount: Number(totalInterest.toFixed(2)),
    days: totalDays,
  };
}
