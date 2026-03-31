import { NextResponse } from "next/server";

import { recordDepositPayment } from "@/lib/server/deposits";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ depositId: string }> },
) {
  try {
    const { depositId } = await context.params;
    const payload = (await request.json()) as {
      paymentDate: string;
      paymentFrom: string;
      paymentUpto: string;
      principalPayment: number;
      interestPayment: number;
      notes?: string;
    };

    const deposit = await recordDepositPayment(depositId, payload);
    return NextResponse.json({ deposit, message: "Payout saved successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save payout." }, { status: 500 });
  }
}
