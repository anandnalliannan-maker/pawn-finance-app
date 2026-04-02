import { getSupabaseServerClient } from "@/lib/supabase/server";
import { postLedgerEntry } from "@/lib/server/ledger";
import type { AppSession } from "@/lib/server/session";
import type { VoucherEntry } from "@/lib/ledger";
import { listVoucherEntries } from "@/lib/server/ledger";

export type CreateVoucherPayload = {
  companyName: string;
  voucherDate: string;
  category: VoucherEntry["category"];
  payee: string;
  remarks?: string;
  amount: number;
  supportingDocuments?: string[];
  sourceAccount: string;
};

function toVoucherCategoryValue(category: VoucherEntry["category"]) {
  switch (category) {
    case "Tea":
      return "tea";
    case "Snacks":
      return "snacks";
    case "Fuel":
      return "fuel";
    case "Salary":
      return "salary";
    default:
      return "miscellaneous";
  }
}

function toLedgerCategoryValue(category: VoucherEntry["category"]) {
  return toVoucherCategoryValue(category);
}

export async function createVoucher(session: AppSession, payload: CreateVoucherPayload) {
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

  const { data: insertedVoucher, error: insertError } = await supabase
    .from("voucher_entries")
    .insert({
      company_id: company.id,
      voucher_date: payload.voucherDate,
      category: toVoucherCategoryValue(payload.category),
      payee: payload.payee.trim(),
      remarks: payload.remarks?.trim() || null,
      amount: payload.amount,
      source_account: payload.sourceAccount,
      supporting_document_paths: payload.supportingDocuments ?? [],
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  await postLedgerEntry({
    companyId: company.id as string,
    entryDate: payload.voucherDate,
    category: toLedgerCategoryValue(payload.category),
    direction: "outgoing",
    description: payload.remarks?.trim() || `${payload.category} expense recorded`,
    reference: payload.payee.trim(),
    amount: payload.amount,
    sourceType: "voucher",
    sourceId: insertedVoucher.id as string,
    sourceAccount: payload.sourceAccount,
    createdBy: session.userId,
    metadata: {
      voucherCategory: payload.category,
    },
  });

  const vouchers = await listVoucherEntries(session);
  return vouchers.find((voucher) => voucher.id === insertedVoucher.id) ?? null;
}
