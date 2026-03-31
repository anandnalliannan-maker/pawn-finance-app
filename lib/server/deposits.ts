import { formatDisplayDate } from "@/lib/date-utils";
import type { CreateDepositPayload, DepositPaymentRecord, DepositRecord } from "@/lib/deposits";
import { canAccessCompanyId, type AppSession } from "@/lib/server/auth";
import { postLedgerEntry } from "@/lib/server/ledger";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CompanyRelation = { name: string } | { name: string }[] | null;
type DepositorRelation = {
  depositor_code: string;
  display_name: string;
  phone_number: string | null;
} | {
  depositor_code: string;
  display_name: string;
  phone_number: string | null;
}[] | null;

type DepositRow = {
  id: string;
  company_id: string;
  deposit_date: string;
  deposit_amount: number | string;
  interest_percent: number | string;
  reference_name: string | null;
  address: string | null;
  supporting_document_paths: unknown;
  status: "active" | "closed";
  companies: CompanyRelation;
  depositors: DepositorRelation;
};

type DepositPaymentRow = {
  id: string;
  deposit_id: string;
  payment_date: string;
  payment_from: string;
  payment_upto: string;
  principal_payment: number | string;
  interest_payment: number | string;
  notes: string | null;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) return [] as T[];
  return Array.isArray(value) ? value : [value];
}
function asNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function mapPayment(row: DepositPaymentRow): DepositPaymentRecord {
  return {
    id: row.id,
    paymentDate: formatDisplayDate(new Date(`${row.payment_date}T00:00:00`)),
    paymentFrom: formatDisplayDate(new Date(`${row.payment_from}T00:00:00`)),
    paymentUpto: formatDisplayDate(new Date(`${row.payment_upto}T00:00:00`)),
    principalPayment: asNumber(row.principal_payment),
    interestPayment: asNumber(row.interest_payment),
    notes: row.notes ?? undefined,
  };
}
function mapDeposit(row: DepositRow, payments: DepositPaymentRow[]): DepositRecord {
  const company = asArray(row.companies)[0]?.name ?? "-";
  const depositor = asArray(row.depositors)[0];
  return {
    id: row.id,
    depositorCode: depositor?.depositor_code ?? "-",
    depositorName: depositor?.display_name ?? "-",
    phoneNumber: depositor?.phone_number ?? "-",
    address: row.address ?? "-",
    reference: row.reference_name ?? "-",
    company,
    depositDate: formatDisplayDate(new Date(`${row.deposit_date}T00:00:00`)),
    depositAmount: asNumber(row.deposit_amount),
    interestPercent: asNumber(row.interest_percent),
    attachmentCount: Array.isArray(row.supporting_document_paths) ? row.supporting_document_paths.length : 0,
    status: row.status === "closed" ? "Closed" : "Active",
    payments: payments.map(mapPayment),
  };
}

async function fetchDepositRows(session: AppSession) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("deposits")
    .select("id, company_id, deposit_date, deposit_amount, interest_percent, reference_name, address, supporting_document_paths, status, companies!inner(name), depositors!inner(depositor_code, display_name, phone_number)")
    .order("deposit_date", { ascending: false });

  if (session.role !== "admin") {
    if (!session.companies.length) {
      return [] as DepositRow[];
    }
    query = query.in("company_id", session.companies.map((company) => company.id));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DepositRow[];
}

export async function listDeposits(session: AppSession) {
  const supabase = getSupabaseServerClient();
  const deposits = await fetchDepositRows(session);
  const ids = deposits.map((deposit) => deposit.id);
  const paymentsByDeposit = new Map<string, DepositPaymentRow[]>();
  if (ids.length) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("deposit_payments")
      .select("id, deposit_id, payment_date, payment_from, payment_upto, principal_payment, interest_payment, notes")
      .in("deposit_id", ids)
      .order("payment_date", { ascending: true });
    if (paymentsError) throw new Error(paymentsError.message);
    for (const payment of (paymentsData ?? []) as DepositPaymentRow[]) {
      const current = paymentsByDeposit.get(payment.deposit_id) ?? [];
      current.push(payment);
      paymentsByDeposit.set(payment.deposit_id, current);
    }
  }
  return deposits.map((deposit) => mapDeposit(deposit, paymentsByDeposit.get(deposit.id) ?? []));
}

export async function getDepositDetailById(session: AppSession, depositId: string) {
  const all = await listDeposits(session);
  return all.find((deposit) => deposit.id === depositId) ?? null;
}

export async function createDeposit(session: AppSession, payload: CreateDepositPayload) {
  const supabase = getSupabaseServerClient();
  const { data: company, error: companyError } = await supabase.from("companies").select("id, name").eq("name", payload.companyName).maybeSingle();
  if (companyError) throw new Error(companyError.message);
  if (!company) throw new Error("Selected company was not found.");
  if (!canAccessCompanyId(session, company.id as string)) throw new Error("You do not have access to the selected company.");

  const { data: depositor, error: depositorError } = await supabase
    .from("depositors")
    .insert({
      company_id: company.id,
      party_type: "individual",
      display_name: payload.depositorName.trim(),
      phone_number: payload.phoneNumber.trim() || null,
      address: payload.address?.trim() || null,
      remarks: payload.reference?.trim() || null,
      created_by: session.userId,
      updated_by: session.userId,
    })
    .select("id")
    .single();
  if (depositorError) throw new Error(depositorError.message);

  const { data: deposit, error: depositError } = await supabase
    .from("deposits")
    .insert({
      depositor_id: depositor.id,
      company_id: company.id,
      deposit_date: payload.depositDate,
      deposit_amount: payload.depositAmount,
      interest_percent: payload.interestPercent,
      reference_name: payload.reference?.trim() || null,
      address: payload.address?.trim() || null,
      supporting_document_paths: payload.supportingDocuments ?? [],
      created_by: session.userId,
      updated_by: session.userId,
    })
    .select("id")
    .single();
  if (depositError) throw new Error(depositError.message);

  await postLedgerEntry({
    companyId: company.id as string,
    entryDate: payload.depositDate,
    category: "deposit_received",
    direction: "incoming",
    description: "Business deposit received",
    reference: payload.depositorName.trim(),
    amount: payload.depositAmount,
    sourceType: "deposit_received",
    sourceId: deposit.id as string,
    createdBy: session.userId,
    metadata: {
      interestPercent: payload.interestPercent,
    },
  });

  return getDepositDetailById(session, deposit.id as string);
}

export async function recordDepositPayment(session: AppSession, depositId: string, payload: { paymentDate: string; paymentFrom: string; paymentUpto: string; principalPayment: number; interestPayment: number; notes?: string }) {
  const supabase = getSupabaseServerClient();
  const { data: deposit, error: depositError } = await supabase
    .from("deposits")
    .select("id, company_id, depositors!inner(display_name)")
    .eq("id", depositId)
    .maybeSingle();
  if (depositError) throw new Error(depositError.message);
  if (!deposit) throw new Error("Deposit was not found.");
  if (!canAccessCompanyId(session, deposit.company_id as string)) throw new Error("You do not have access to this deposit.");

  const { data: paymentRow, error } = await supabase.from("deposit_payments").insert({
    deposit_id: depositId,
    payment_date: payload.paymentDate,
    payment_from: payload.paymentFrom,
    payment_upto: payload.paymentUpto,
    principal_payment: payload.principalPayment,
    interest_payment: payload.interestPayment,
    notes: payload.notes?.trim() || null,
    created_by: session.userId,
  }).select("id").single();
  if (error) throw new Error(error.message);

  await postLedgerEntry({
    companyId: deposit.company_id as string,
    entryDate: payload.paymentDate,
    category: "deposit_payout",
    direction: "outgoing",
    description: "Deposit payout recorded",
    reference: asArray(deposit.depositors)[0]?.display_name ?? "Deposit payout",
    amount: payload.principalPayment + payload.interestPayment,
    sourceType: "deposit_payout",
    sourceId: paymentRow.id as string,
    createdBy: session.userId,
    metadata: {
      principalPayment: payload.principalPayment,
      interestPayment: payload.interestPayment,
    },
  });

  return getDepositDetailById(session, depositId);
}
