import { NextResponse } from "next/server";

import { getLoanDetailById } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  try {
    const { loanId } = await context.params;
    const loan = await getLoanDetailById(loanId);

    if (!loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    return NextResponse.json({ loan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load loan." },
      { status: 500 },
    );
  }
}
