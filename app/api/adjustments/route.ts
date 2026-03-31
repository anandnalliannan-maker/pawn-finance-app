import { NextResponse } from "next/server";

import type { CreatePaymentAdjustmentPayload } from "@/lib/adjustments";
import { createPaymentAdjustment, listPaymentAdjustments } from "@/lib/server/adjustments";

export const runtime = "nodejs";

export async function GET() {
  try {
    const adjustments = await listPaymentAdjustments();
    return NextResponse.json({ adjustments });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load adjustments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreatePaymentAdjustmentPayload & { loanId: string };
    if (!payload.loanId || !payload.originalPaymentId) {
      return NextResponse.json({ error: "Loan and payment references are required." }, { status: 400 });
    }

    const adjustment = await createPaymentAdjustment(payload.loanId, payload);
    return NextResponse.json({ adjustment, message: "Adjustment posted successfully." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save adjustment." }, { status: 500 });
  }
}
