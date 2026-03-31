import { NextResponse } from "next/server";

import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { listCashBookDays, saveCashBookDay } from "@/lib/server/cash-book";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const days = await listCashBookDays(session);
    return NextResponse.json({ days });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load cash book." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = (await request.json()) as {
      companyName?: string;
      bookDate?: string;
      openingBalance?: number;
      totalIncoming?: number;
      totalOutgoing?: number;
      expectedClosingBalance?: number;
      cashInHand?: number;
      reconciliationDifference?: number;
      remarks?: string;
    };

    if (!payload.companyName?.trim() || !payload.bookDate) {
      return NextResponse.json({ error: "Company and book date are required." }, { status: 400 });
    }

    if (!canAccessCompanyName(session, payload.companyName)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }

    const day = await saveCashBookDay(session, {
      companyName: payload.companyName,
      bookDate: payload.bookDate,
      openingBalance: payload.openingBalance ?? 0,
      totalIncoming: payload.totalIncoming ?? 0,
      totalOutgoing: payload.totalOutgoing ?? 0,
      expectedClosingBalance: payload.expectedClosingBalance ?? 0,
      cashInHand: payload.cashInHand ?? 0,
      reconciliationDifference: payload.reconciliationDifference ?? 0,
      remarks: payload.remarks,
    });

    return NextResponse.json({ day, message: "Cash book saved successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save cash book." }, { status: 500 });
  }
}
