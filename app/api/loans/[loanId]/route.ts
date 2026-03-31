import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { getLoanDetailById } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function GET(_: Request, context: RouteContext<"/api/loans/[loanId]">) {
  try {
    const session = await requireApiSession();
    const { loanId } = await context.params;
    const loan = await getLoanDetailById(session, loanId);

    if (!loan) {
      return NextResponse.json({ error: "Loan was not found." }, { status: 404 });
    }

    return NextResponse.json({ loan });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load loan." }, { status: 500 });
  }
}
