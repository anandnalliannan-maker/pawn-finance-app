import { NextResponse } from "next/server";

import type { CreateDepositPayload } from "@/lib/deposits";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { createDeposit, listDeposits } from "@/lib/server/deposits";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const deposits = await listDeposits(session);
    return NextResponse.json({ deposits });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load deposits." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = (await request.json()) as CreateDepositPayload;
    if (!payload.companyName?.trim() || !payload.depositorName?.trim()) {
      return NextResponse.json({ error: "Company and depositor name are required." }, { status: 400 });
    }
    if (!canAccessCompanyName(session, payload.companyName)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }
    const deposit = await createDeposit(session, payload);
    return NextResponse.json({ deposit, message: "Deposit saved successfully." }, { status: 201 });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save deposit." }, { status: 500 });
  }
}
