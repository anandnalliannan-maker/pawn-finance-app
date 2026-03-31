import type { CreatePaymentAdjustmentPayload, PaymentAdjustmentRecord, PaymentAdjustmentType } from "@/lib/adjustments";
import { formatDisplayDate } from "@/lib/date-utils";
import { canAccessCompanyId, type AppSession } from "@/lib/server/auth";
import { postLedgerEntry } from "@/lib/server/ledger";
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
  loans: { id: string; account_number: string; company_id: string; companies: { name: string } | { name: string }[] | null; customers: { full_name: string } | { full_name: string }[] | null } | { id: string; account_number: string; company_id: string; companies: { name: string } | { name: string }[] | null; customers: { full_name: string } | { full_name: string }[] | null }[] | null;
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

export async function listPaymentAdjustments(session: AppSession) {
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
      loans!inner(id, account_number, company_id, companies!inner(name), customers!inner(full_name)),
      loan_payments!inner(payment_date)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as AdjustmentRow[])
    .filter((row) => {
      const loan = asArray(row.loans)[0];
      return loan ? canAccessCompanyId(session, loan.company_id) : false;
    })
    .map(mapAdjustment);
}

export async function createPaymentAdjustment(session: AppSession, loanId: string, payload: CreatePaymentAdjustmentPayload) {
  const supabase = getSupabaseServerClient();
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("id, account_number, company_id, customers!inner(full_name)")
    .eq("id", loanId)
    .maybeSingle();

  if (loanError) throw new Error(loanError.message);
  if (!loan || !canAccessCompanyId(session, loan.company_id as string)) throw new Error("You do not have access to this loan.");

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
      created_by: session.userId,
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
      loans!inner(id, account_number, company_id, companies!inner(name), customers!inner(full_name)),
      loan_payments!inner(payment_date)
    `)
    .single();

  if (error) throw new Error(error.message);

  const netEffect = payload.principalAdjustment + payload.interestAdjustment;
  if (netEffect !== 0) {
    await postLedgerEntry({
      companyId: loan.company_id as string,
      entryDate: payload.correctedPaymentUpto,
      category: "payment_adjustment",
      direction: netEffect >= 0 ? "incoming" : "outgoing",
      description: `Payment adjustment posted for account ${loan.account_number as string}`,
      reference: asArray(loan.customers)[0]?.full_name ?? "Payment adjustment",
      amount: Math.abs(netEffect),
      sourceType: "loan_payment_adjustment",
      sourceId: (data as AdjustmentRow).id,
      createdBy: session.userId,
      metadata: {
        principalAdjustment: payload.principalAdjustment,
        interestAdjustment: payload.interestAdjustment,
      },
    });
  }

  return mapAdjustment(data as AdjustmentRow);
}
