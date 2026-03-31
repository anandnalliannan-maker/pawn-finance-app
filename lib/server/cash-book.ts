import { formatDisplayDate } from "@/lib/date-utils";
import type { CashBookDayRecord } from "@/lib/cash-book";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppSession } from "@/lib/server/session";

export type SaveCashBookPayload = {
  companyName: string;
  bookDate: string;
  openingBalance: number;
  totalIncoming: number;
  totalOutgoing: number;
  expectedClosingBalance: number;
  cashInHand: number;
  reconciliationDifference: number;
  remarks?: string;
};

type CashBookRow = {
  id: string;
  book_date: string;
  opening_balance: number | string;
  total_incoming: number | string;
  total_outgoing: number | string;
  expected_closing_balance: number | string;
  cash_in_hand: number | string;
  reconciliation_difference: number | string;
  status: "balanced" | "excess" | "shortage";
  remarks: string | null;
  company_id: string;
  companies: { name: string } | { name: string }[] | null;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return [] as T[];
  }
  return Array.isArray(value) ? value : [value];
}

function asNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStatusLabel(value: CashBookRow["status"]): CashBookDayRecord["status"] {
  if (value === "excess") {
    return "Excess";
  }
  if (value === "shortage") {
    return "Shortage";
  }
  return "Balanced";
}

function mapCashBookRow(row: CashBookRow): CashBookDayRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    company: asArray(row.companies)[0]?.name ?? "-",
    bookDate: formatDisplayDate(new Date(`${row.book_date}T00:00:00`)),
    openingBalance: asNumber(row.opening_balance),
    totalIncoming: asNumber(row.total_incoming),
    totalOutgoing: asNumber(row.total_outgoing),
    expectedClosingBalance: asNumber(row.expected_closing_balance),
    cashInHand: asNumber(row.cash_in_hand),
    reconciliationDifference: asNumber(row.reconciliation_difference),
    status: toStatusLabel(row.status),
    remarks: row.remarks ?? "",
  };
}

export async function listCashBookDays(session: AppSession) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("cash_book_days")
    .select("id, book_date, opening_balance, total_incoming, total_outgoing, expected_closing_balance, cash_in_hand, reconciliation_difference, status, remarks, company_id, companies!inner(name)")
    .order("book_date", { ascending: false })
    .limit(180);

  if (session.role !== "admin") {
    if (!session.companies.length) {
      return [] as CashBookDayRecord[];
    }
    query = query.in("company_id", session.companies.map((company) => company.id));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CashBookRow[]).map(mapCashBookRow);
}

export async function saveCashBookDay(session: AppSession, payload: SaveCashBookPayload) {
  const supabase = getSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("name", payload.companyName)
    .maybeSingle();

  if (companyError) {
    throw new Error(companyError.message);
  }
  if (!company) {
    throw new Error("Selected company was not found.");
  }

  const status = payload.reconciliationDifference === 0 ? "balanced" : payload.reconciliationDifference > 0 ? "excess" : "shortage";

  const { data, error } = await supabase
    .from("cash_book_days")
    .upsert(
      {
        company_id: company.id,
        book_date: payload.bookDate,
        opening_balance: payload.openingBalance,
        total_incoming: payload.totalIncoming,
        total_outgoing: payload.totalOutgoing,
        expected_closing_balance: payload.expectedClosingBalance,
        cash_in_hand: payload.cashInHand,
        reconciliation_difference: payload.reconciliationDifference,
        remarks: payload.remarks?.trim() || null,
        status,
        saved_by: session.userId,
      },
      { onConflict: "company_id,book_date" },
    )
    .select("id, book_date, opening_balance, total_incoming, total_outgoing, expected_closing_balance, cash_in_hand, reconciliation_difference, status, remarks, company_id, companies!inner(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCashBookRow(data as CashBookRow);
}
