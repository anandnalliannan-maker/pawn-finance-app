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
