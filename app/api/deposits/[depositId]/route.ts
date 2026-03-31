import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { getDepositDetailById } from "@/lib/server/deposits";

export const runtime = "nodejs";

export async function GET(_: Request, context: RouteContext<"/api/deposits/[depositId]">) {
  try {
    const session = await requireApiSession();
    const { depositId } = await context.params;
    const deposit = await getDepositDetailById(session, depositId);
    if (!deposit) {
      return NextResponse.json({ error: "Deposit was not found." }, { status: 404 });
    }
    return NextResponse.json({ deposit });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load deposit." }, { status: 500 });
  }
}
