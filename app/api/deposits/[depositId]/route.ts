import { NextResponse } from "next/server";

import { getDepositDetailById } from "@/lib/server/deposits";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ depositId: string }> },
) {
  try {
    const { depositId } = await context.params;
    const deposit = await getDepositDetailById(depositId);
    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
    }
    return NextResponse.json({ deposit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load deposit." }, { status: 500 });
  }
}
