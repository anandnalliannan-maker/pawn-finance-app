import type { CreatePaymentAdjustmentPayload, PaymentAdjustmentRecord, PaymentAdjustmentType } from "@/lib/adjustments";
import { formatDisplayDate } from "@/lib/date-utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AdjustmentRow = {
  id: string;
  loan_id: string;
  original_payment_id: string;
  correction_type: "full_reversal" | "partial_adjustment";
  principal_adjustment: number | string;
  interest_adjustment: number | string;
  corrected_payment_from: string;
  corrected_payment_upto: string;
  reason: string;
  acknowledged_by: string;
  status: "posted";
  created_at: string;
  loans: { account_number: string; companies: { name: string } | { name: string }[] | null; customers: { full_name: string } | { full_name: string }[] | null } | { account_number: string; companies: { name: string } | { name: string }[] | null; customers: { full_name: string } | { full_name: string }[] | null }[] | null;
  loan_payments: { payment_date: string } | { payment_date: string }[] | null;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) return [] as T[];
  return Array.isArray(value) ? value : [value];
}
function asNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function toTypeLabel(value: "full_reversal" | "partial_adjustment"): PaymentAdjustmentType {
  return value === "full_reversal" ? "Full Reversal" : "Partial Adjustment";
}
function toTypeValue(value: PaymentAdjustmentType) {
  return value === "Full Reversal" ? "full_reversal" : "partial_adjustment";
}
function mapAdjustment(row: AdjustmentRow): PaymentAdjustmentRecord {
  const loan = asArray(row.loans)[0];
  const companyName = loan ? asArray(loan.companies)[0]?.name ?? "-" : "-";
  const customerName = loan ? asArray(loan.customers)[0]?.full_name ?? "-" : "-";
  const payment = asArray(row.loan_payments)[0];

  return {
    id: row.id,
    loanId: row.loan_id,
    loanAccountNumber: loan?.account_number ?? "-",
    company: companyName,
    customerName,
    originalPaymentId: row.original_payment_id,
    originalPaymentDate: payment ? formatDisplayDate(new Date(`${payment.payment_date}T00:00:00`)) : "-",
    correctionType: toTypeLabel(row.correction_type),
    principalAdjustment: asNumber(row.principal_adjustment),
    interestAdjustment: asNumber(row.interest_adjustment),
    correctedPaymentFrom: formatDisplayDate(new Date(`${row.corrected_payment_from}T00:00:00`)),
    correctedPaymentUpto: formatDisplayDate(new Date(`${row.corrected_payment_upto}T00:00:00`)),
    reason: row.reason,
    acknowledgedBy: row.acknowledged_by,
    createdAt: formatDisplayDate(new Date(row.created_at)),
    status: "Posted",
  };
}

export async function listPaymentAdjustments() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("loan_payment_adjustments")
    .select(`
      id,
      loan_id,
      original_payment_id,
      correction_type,
      principal_adjustment,
      interest_adjustment,
      corrected_payment_from,
      corrected_payment_upto,
      reason,
      acknowledged_by,
      status,
      created_at,
      loans!inner(account_number, companies!inner(name), customers!inner(full_name)),
      loan_payments!inner(payment_date)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as AdjustmentRow[]).map(mapAdjustment);
}

export async function createPaymentAdjustment(loanId: string, payload: CreatePaymentAdjustmentPayload) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("loan_payment_adjustments")
    .insert({
      loan_id: loanId,
      original_payment_id: payload.originalPaymentId,
      correction_type: toTypeValue(payload.correctionType),
      principal_adjustment: payload.principalAdjustment,
      interest_adjustment: payload.interestAdjustment,
      corrected_payment_from: payload.correctedPaymentFrom,
      corrected_payment_upto: payload.correctedPaymentUpto,
      reason: payload.reason.trim(),
      acknowledged_by: payload.acknowledgedBy.trim(),
    })
    .select(`
      id,
      loan_id,
      original_payment_id,
      correction_type,
      principal_adjustment,
      interest_adjustment,
      corrected_payment_from,
      corrected_payment_upto,
      reason,
      acknowledged_by,
      status,
      created_at,
      loans!inner(account_number, companies!inner(name), customers!inner(full_name)),
      loan_payments!inner(payment_date)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapAdjustment(data as AdjustmentRow);
}
