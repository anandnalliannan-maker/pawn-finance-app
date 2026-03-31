import { NextResponse } from "next/server";

import type { SaveLoanSchemePayload } from "@/lib/schemes";
import { listLoanSchemes, saveLoanScheme } from "@/lib/server/schemes";

export const runtime = "nodejs";

export async function GET() {
  try {
    const schemes = await listLoanSchemes();
    return NextResponse.json({ schemes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load schemes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SaveLoanSchemePayload;
    if (!payload.companyName?.trim() || !payload.name?.trim()) {
      return NextResponse.json({ error: "Company and scheme name are required." }, { status: 400 });
    }
    const schemes = await saveLoanScheme(payload);
    return NextResponse.json({ schemes, message: "Scheme saved successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save scheme." }, { status: 500 });
  }
}
