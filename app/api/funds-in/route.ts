import { NextResponse } from "next/server";

import type { CreateFundsInPayload } from "@/lib/funds-in";
import { fundSourceTypes } from "@/lib/funds-in";
import { isSourceAccount } from "@/lib/source-accounts";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { createFundsInEntry, listFundsInEntries } from "@/lib/server/funds-in";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const entries = await listFundsInEntries(session);
    return NextResponse.json({ entries });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load funds in entries." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = (await request.json()) as CreateFundsInPayload;

    if (!payload.companyName?.trim() || !payload.entryDate || !payload.receivedFrom?.trim()) {
      return NextResponse.json({ error: "Company, date, and received from are required." }, { status: 400 });
    }

    if (!canAccessCompanyName(session, payload.companyName)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }

    if (!payload.sourceType || !fundSourceTypes.includes(payload.sourceType)) {
      return NextResponse.json({ error: "Select a valid funds-in source type." }, { status: 400 });
    }

    if (!(payload.amount > 0)) {
      return NextResponse.json({ error: "Funds in amount must be greater than zero." }, { status: 400 });
    }

    if (!payload.account?.trim() || !isSourceAccount(payload.account)) {
      return NextResponse.json({ error: "Select a valid destination account." }, { status: 400 });
    }

    const entry = await createFundsInEntry(session, payload);
    return NextResponse.json({ entry, message: "Funds in recorded successfully." }, { status: 201 });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save funds in entry." }, { status: 500 });
  }
}
