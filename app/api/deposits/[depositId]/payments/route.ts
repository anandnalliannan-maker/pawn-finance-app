import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { recordDepositPayment } from "@/lib/server/deposits";

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext<"/api/deposits/[depositId]/payments">) {
  try {
    const session = await requireApiSession();
    const { depositId } = await context.params;
    const payload = (await request.json()) as {
      paymentDate: string;
      paymentFrom: string;
      paymentUpto: string;
      principalPayment: number;
      interestPayment: number;
      notes?: string;
    };

    const deposit = await recordDepositPayment(session, depositId, payload);
    return NextResponse.json({ deposit, message: "Payout recorded successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save payout." }, { status: 500 });
  }
}
