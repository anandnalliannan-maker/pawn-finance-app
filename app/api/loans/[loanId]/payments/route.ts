import { NextResponse } from "next/server";

import type { RecordLoanPaymentPayload } from "@/lib/loans";
import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { recordLoanPayment } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext<"/api/loans/[loanId]/payments">) {
  try {
    const session = await requireApiSession();
    const { loanId } = await context.params;
    const payload = (await request.json()) as RecordLoanPaymentPayload;

    const loan = await recordLoanPayment(session, loanId, payload);
    return NextResponse.json({ loan, message: "Payment recorded successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save payment." }, { status: 500 });
  }
}
