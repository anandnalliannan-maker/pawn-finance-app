import { NextResponse } from "next/server";

import type { CreateDepositPayload } from "@/lib/deposits";
import { createDeposit, listDeposits } from "@/lib/server/deposits";

export const runtime = "nodejs";

export async function GET() {
  try {
    const deposits = await listDeposits();
    return NextResponse.json({ deposits });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load deposits." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateDepositPayload;
    if (!payload.companyName?.trim() || !payload.depositorName?.trim()) {
      return NextResponse.json({ error: "Company and depositor name are required." }, { status: 400 });
    }
    const deposit = await createDeposit(payload);
    return NextResponse.json({ deposit, message: "Deposit saved successfully." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save deposit." }, { status: 500 });
  }
}
