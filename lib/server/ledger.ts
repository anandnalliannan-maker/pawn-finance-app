import { formatDisplayDate } from "@/lib/date-utils";
import type { LedgerCategory, LedgerEntry, TransactionDirection, VoucherCategory, VoucherEntry } from "@/lib/ledger";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppSession } from "@/lib/server/session";

type CompanyRelation = { name: string } | { name: string }[] | null;

type LedgerRow = {
  id: string;
  entry_date: string;
  category:
    | "incoming_payment"
    | "outgoing_loan"
    | "deposit_received"
    | "deposit_payout"
    | "tea"
    | "snacks"
    | "fuel"
    | "salary"
    | "miscellaneous"
    | "payment_adjustment";
  direction: "incoming" | "outgoing";
  description: string;
  reference: string;
  amount: number | string;
  companies: CompanyRelation;
};

type VoucherRow = {
  id: string;
  voucher_date: string;
  category: "tea" | "snacks" | "fuel" | "salary" | "miscellaneous";
  payee: string;
  remarks: string | null;
  amount: number | string;
  supporting_document_paths: unknown;
  companies: CompanyRelation;
};

type LedgerSourceType =
  | "loan_disbursal"
  | "loan_payment"
  | "deposit_received"
  | "deposit_payout"
  | "voucher"
  | "loan_payment_adjustment";

type LedgerInsertInput = {
  companyId: string;
  entryDate: string;
  category:
    | "incoming_payment"
    | "outgoing_loan"
    | "deposit_received"
    | "deposit_payout"
    | "tea"
    | "snacks"
    | "fuel"
    | "salary"
    | "miscellaneous"
    | "payment_adjustment";
  direction: "incoming" | "outgoing";
  description: string;
  reference: string;
  amount: number;
  sourceType: LedgerSourceType;
  sourceId: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return [] as T[];
  }
  return Array.isArray(value) ? value : [value];
}

function companyNameFromRelation(companies: CompanyRelation) {
  return asArray(companies)[0]?.name ?? "-";
}

function asNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toLedgerCategory(value: LedgerRow["category"]): LedgerCategory {
  switch (value) {
    case "incoming_payment":
      return "Incoming Payment";
    case "outgoing_loan":
      return "Outgoing Loan";
    case "deposit_received":
      return "Deposit Received";
    case "deposit_payout":
      return "Deposit Payout";
    case "payment_adjustment":
      return "Payment Adjustment";
    case "tea":
      return "Tea";
    case "snacks":
      return "Snacks";
    case "fuel":
      return "Fuel";
    case "salary":
      return "Salary";
    default:
      return "Miscellaneous";
  }
}

function toVoucherCategory(value: VoucherRow["category"]): VoucherCategory {
  switch (value) {
    case "tea":
      return "Tea";
    case "snacks":
      return "Snacks";
    case "fuel":
      return "Fuel";
    case "salary":
      return "Salary";
    default:
      return "Miscellaneous";
  }
}

function toDirection(value: LedgerRow["direction"]): TransactionDirection {
  return value === "incoming" ? "Incoming" : "Outgoing";
}

export async function postLedgerEntry(input: LedgerInsertInput) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ledger_entries").upsert(
    {
      company_id: input.companyId,
      entry_date: input.entryDate,
      category: input.category,
      direction: input.direction,
      description: input.description,
      reference: input.reference,
      amount: input.amount,
      source_type: input.sourceType,
      source_id: input.sourceId,
      metadata: input.metadata ?? {},
      created_by: input.createdBy ?? null,
    },
    { onConflict: "source_type,source_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function listLedgerEntries(session: AppSession) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("ledger_entries")
    .select("id, entry_date, category, direction, description, reference, amount, companies!inner(name)")
    .order("entry_date", { ascending: false })
    .limit(500);

  if (session.role !== "admin") {
    if (!session.companies.length) {
      return [] as LedgerEntry[];
    }
    query = query.in("company_id", session.companies.map((company) => company.id));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LedgerRow[]).map((row) => ({
    id: row.id,
    date: formatDisplayDate(new Date(`${row.entry_date}T00:00:00`)),
    company: companyNameFromRelation(row.companies),
    category: toLedgerCategory(row.category),
    direction: toDirection(row.direction),
    description: row.description,
    reference: row.reference,
    amount: asNumber(row.amount),
  }));
}

export async function listVoucherEntries(session: AppSession) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("voucher_entries")
    .select("id, voucher_date, category, payee, remarks, amount, supporting_document_paths, companies!inner(name)")
    .order("voucher_date", { ascending: false })
    .limit(250);

  if (session.role !== "admin") {
    if (!session.companies.length) {
      return [] as VoucherEntry[];
    }
    query = query.in("company_id", session.companies.map((company) => company.id));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as VoucherRow[]).map((row) => ({
    id: row.id,
    date: formatDisplayDate(new Date(`${row.voucher_date}T00:00:00`)),
    company: companyNameFromRelation(row.companies),
    category: toVoucherCategory(row.category),
    payee: row.payee,
    remarks: row.remarks ?? "",
    amount: asNumber(row.amount),
    attachmentCount: Array.isArray(row.supporting_document_paths) ? row.supporting_document_paths.length : 0,
  }));
}
