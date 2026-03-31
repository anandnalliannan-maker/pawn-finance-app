import { NextResponse } from "next/server";

import { recordLoanPayment } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  try {
    const { loanId } = await context.params;
    const payload = (await request.json()) as {
      paymentDate: string;
      paymentFrom: string;
      paymentUpto: string;
      principalPayment: number;
      interestPayment: number;
      notes?: string;
    };

    if (!payload.paymentDate || !payload.paymentFrom || !payload.paymentUpto) {
      return NextResponse.json(
        { error: "Payment date and interest period are required." },
        { status: 400 },
      );
    }

    const loan = await recordLoanPayment(loanId, payload);
    return NextResponse.json({ loan, message: "Payment saved successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save payment." },
      { status: 500 },
    );
  }
}
