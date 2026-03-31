import { formatDisplayDate } from "@/lib/date-utils";
import type { CreateDepositPayload, DepositPaymentRecord, DepositRecord } from "@/lib/deposits";
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

export async function listDeposits() {
  const supabase = getSupabaseServerClient();
  const { data: depositsData, error: depositsError } = await supabase
    .from("deposits")
    .select("id, deposit_date, deposit_amount, interest_percent, reference_name, address, supporting_document_paths, status, companies!inner(name), depositors!inner(depositor_code, display_name, phone_number)")
    .order("deposit_date", { ascending: false });
  if (depositsError) throw new Error(depositsError.message);
  const deposits = (depositsData ?? []) as DepositRow[];
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

export async function getDepositDetailById(depositId: string) {
  const all = await listDeposits();
  return all.find((deposit) => deposit.id === depositId) ?? null;
}

export async function createDeposit(payload: CreateDepositPayload) {
  const supabase = getSupabaseServerClient();
  const { data: company, error: companyError } = await supabase.from("companies").select("id, name").eq("name", payload.companyName).maybeSingle();
  if (companyError) throw new Error(companyError.message);
  if (!company) throw new Error("Selected company was not found.");

  const { data: depositor, error: depositorError } = await supabase
    .from("depositors")
    .insert({
      company_id: company.id,
      party_type: "individual",
      display_name: payload.depositorName.trim(),
      phone_number: payload.phoneNumber.trim() || null,
      address: payload.address?.trim() || null,
      remarks: payload.reference?.trim() || null,
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
    })
    .select("id")
    .single();
  if (depositError) throw new Error(depositError.message);

  return getDepositDetailById(deposit.id as string);
}

export async function recordDepositPayment(depositId: string, payload: { paymentDate: string; paymentFrom: string; paymentUpto: string; principalPayment: number; interestPayment: number; notes?: string }) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("deposit_payments").insert({
    deposit_id: depositId,
    payment_date: payload.paymentDate,
    payment_from: payload.paymentFrom,
    payment_upto: payload.paymentUpto,
    principal_payment: payload.principalPayment,
    interest_payment: payload.interestPayment,
    notes: payload.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return getDepositDetailById(depositId);
}
