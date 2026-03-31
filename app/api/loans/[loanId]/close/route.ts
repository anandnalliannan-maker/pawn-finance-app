import { NextResponse } from "next/server";

import { closeLoan } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  try {
    const { loanId } = await context.params;
    const loan = await closeLoan(loanId);
    return NextResponse.json({ loan, message: "Loan closed successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to close loan." },
      { status: 500 },
    );
  }
}
