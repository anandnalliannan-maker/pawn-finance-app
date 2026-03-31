import { NextResponse } from "next/server";

import type { CreatePaymentAdjustmentPayload } from "@/lib/adjustments";
import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { createPaymentAdjustment, listPaymentAdjustments } from "@/lib/server/adjustments";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const adjustments = await listPaymentAdjustments(session);
    return NextResponse.json({ adjustments });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load adjustments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = (await request.json()) as CreatePaymentAdjustmentPayload & { loanId?: string };
    if (!payload.loanId) {
      return NextResponse.json({ error: "Loan reference is required for adjustment." }, { status: 400 });
    }
    const adjustment = await createPaymentAdjustment(session, payload.loanId, payload);
    return NextResponse.json({ adjustment, message: "Adjustment saved successfully." }, { status: 201 });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save adjustment." }, { status: 500 });
  }
}
