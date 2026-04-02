import { getSupabaseServerClient } from "@/lib/supabase/server";
import { postLedgerEntry } from "@/lib/server/ledger";
import type { AppSession } from "@/lib/server/session";
import type { CreateFundsInPayload, FundSourceType, FundsInRecord } from "@/lib/funds-in";
import { formatDisplayDate } from "@/lib/date-utils";

type CompanyRelation = { name: string } | { name: string }[] | null;

type FundsInRow = {
  id: string;
  entry_date: string;
  source_type: "owner_capital" | "partner_capital" | "bank_withdrawal" | "inter_branch_transfer" | "other_funds";
  received_from: string;
  amount: number | string;
  destination_account: string | null;
  remarks: string | null;
  supporting_document_paths: unknown;
  companies: CompanyRelation;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) return [] as T[];
  return Array.isArray(value) ? value : [value];
}

function asNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function companyName(companies: CompanyRelation) {
  return asArray(companies)[0]?.name ?? "-";
}

function toDbSourceType(value: FundSourceType) {
  switch (value) {
    case "Owner Capital":
      return "owner_capital";
    case "Partner Capital":
      return "partner_capital";
    case "Bank Withdrawal":
      return "bank_withdrawal";
    case "Inter-branch Transfer":
      return "inter_branch_transfer";
    default:
      return "other_funds";
  }
}

function fromDbSourceType(value: FundsInRow["source_type"]): FundSourceType {
  switch (value) {
    case "owner_capital":
      return "Owner Capital";
    case "partner_capital":
      return "Partner Capital";
    case "bank_withdrawal":
      return "Bank Withdrawal";
    case "inter_branch_transfer":
      return "Inter-branch Transfer";
    default:
      return "Other Funds";
  }
}

function mapFundsIn(row: FundsInRow): FundsInRecord {
  return {
    id: row.id,
    date: formatDisplayDate(new Date(`${row.entry_date}T00:00:00`)),
    company: companyName(row.companies),
    sourceType: fromDbSourceType(row.source_type),
    receivedFrom: row.received_from,
    amount: asNumber(row.amount),
    account: row.destination_account ?? "-",
    remarks: row.remarks ?? "",
    attachmentCount: Array.isArray(row.supporting_document_paths) ? row.supporting_document_paths.length : 0,
  };
}

export async function listFundsInEntries(session: AppSession) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("funds_in_entries")
    .select("id, entry_date, source_type, received_from, amount, destination_account, remarks, supporting_document_paths, companies!inner(name)")
    .order("entry_date", { ascending: false })
    .limit(250);

  if (session.role !== "admin") {
    if (!session.companies.length) {
      return [] as FundsInRecord[];
    }
    query = query.in("company_id", session.companies.map((company) => company.id));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as FundsInRow[]).map(mapFundsIn);
}

export async function createFundsInEntry(session: AppSession, payload: CreateFundsInPayload) {
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

  const { data: entry, error: entryError } = await supabase
    .from("funds_in_entries")
    .insert({
      company_id: company.id,
      entry_date: payload.entryDate,
      source_type: toDbSourceType(payload.sourceType),
      received_from: payload.receivedFrom.trim(),
      amount: payload.amount,
      destination_account: payload.account,
      remarks: payload.remarks?.trim() || null,
      supporting_document_paths: payload.supportingDocuments ?? [],
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (entryError) {
    throw new Error(entryError.message);
  }

  await postLedgerEntry({
    companyId: company.id as string,
    entryDate: payload.entryDate,
    category: "funds_in",
    direction: "incoming",
    description: `${payload.sourceType} recorded`,
    reference: payload.receivedFrom.trim(),
    amount: payload.amount,
    sourceType: "funds_in",
    sourceId: entry.id as string,
    sourceAccount: payload.account,
    createdBy: session.userId,
    metadata: {
      sourceType: payload.sourceType,
      destinationAccount: payload.account,
      remarks: payload.remarks?.trim() || null,
    },
  });

  const entries = await listFundsInEntries(session);
  return entries.find((item) => item.id === entry.id) ?? null;
}
