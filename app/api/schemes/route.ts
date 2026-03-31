import { NextResponse } from "next/server";

import type { SaveLoanSchemePayload } from "@/lib/schemes";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { listLoanSchemes, saveLoanScheme } from "@/lib/server/schemes";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireApiSession();
    const schemes = await listLoanSchemes();
    const visibleSchemes = session.role === "admin"
      ? schemes
      : schemes.filter((scheme) => session.companies.some((company) => company.name === scheme.company));
    return NextResponse.json({ schemes: visibleSchemes });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load schemes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireApiSession({ roles: ["admin"] });
    const payload = (await request.json()) as SaveLoanSchemePayload;
    if (!canAccessCompanyName(await requireApiSession({ roles: ["admin"] }), payload.companyName)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }
    const schemes = await saveLoanScheme(payload);
    return NextResponse.json({ schemes, message: "Scheme saved successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save scheme." }, { status: 500 });
  }
}
