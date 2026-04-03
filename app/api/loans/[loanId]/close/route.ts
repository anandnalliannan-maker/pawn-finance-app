import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { closeLoan } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function POST(_: Request, context: RouteContext<"/api/loans/[loanId]/close">) {
  try {
    const session = await requireApiSession();
    const { loanId } = await context.params;
    const loan = await closeLoan(session, loanId);
    return NextResponse.json({ loan, message: "Loan closed successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Unable to close loan.";
    const status = message.includes("cannot be closed") ? 400 : message.includes("was not found") ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

