import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { listLedgerEntries } from "@/lib/server/ledger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const entries = await listLedgerEntries(session);
    return NextResponse.json({ entries });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load ledger." }, { status: 500 });
  }
}
