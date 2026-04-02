import { NextResponse } from "next/server";

import { isSourceAccount } from "@/lib/source-accounts";
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
      sourceAccount?: string;
      notes?: string;
    };

    if (!payload.sourceAccount?.trim() || !isSourceAccount(payload.sourceAccount)) {
      return NextResponse.json({ error: "Select a valid source account for the payout." }, { status: 400 });
    }

    const deposit = await recordDepositPayment(session, depositId, {
      paymentDate: payload.paymentDate,
      paymentFrom: payload.paymentFrom,
      paymentUpto: payload.paymentUpto,
      principalPayment: payload.principalPayment,
      interestPayment: payload.interestPayment,
      sourceAccount: payload.sourceAccount,
      notes: payload.notes,
    });
    return NextResponse.json({ deposit, message: "Payout recorded successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save payout." }, { status: 500 });
  }
}
