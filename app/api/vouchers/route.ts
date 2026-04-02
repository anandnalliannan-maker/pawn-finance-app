import { NextResponse } from "next/server";

import { voucherCategories, type VoucherEntry } from "@/lib/ledger";
import { isSourceAccount } from "@/lib/source-accounts";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { listVoucherEntries } from "@/lib/server/ledger";
import { createVoucher } from "@/lib/server/vouchers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const vouchers = await listVoucherEntries(session);
    return NextResponse.json({ vouchers });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load vouchers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = (await request.json()) as {
      companyName?: string;
      voucherDate?: string;
      category?: VoucherEntry["category"];
      payee?: string;
      remarks?: string;
      amount?: number;
      supportingDocuments?: string[];
      sourceAccount?: string;
    };

    if (!payload.companyName?.trim() || !payload.voucherDate || !payload.payee?.trim()) {
      return NextResponse.json({ error: "Company, voucher date, and payee are required." }, { status: 400 });
    }

    if (!payload.category || !voucherCategories.includes(payload.category)) {
      return NextResponse.json({ error: "Select a valid voucher category." }, { status: 400 });
    }

    if (!(payload.amount && payload.amount > 0)) {
      return NextResponse.json({ error: "Voucher amount must be greater than zero." }, { status: 400 });
    }

    if (!payload.sourceAccount?.trim() || !isSourceAccount(payload.sourceAccount)) {
      return NextResponse.json({ error: "Select a valid source account for the expense." }, { status: 400 });
    }

    if (!canAccessCompanyName(session, payload.companyName)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }

    const voucher = await createVoucher(session, {
      companyName: payload.companyName,
      voucherDate: payload.voucherDate,
      category: payload.category,
      payee: payload.payee,
      remarks: payload.remarks,
      amount: payload.amount,
      supportingDocuments: payload.supportingDocuments,
      sourceAccount: payload.sourceAccount,
    });

    return NextResponse.json({ voucher, message: "Voucher saved successfully." }, { status: 201 });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save voucher." }, { status: 500 });
  }
}
