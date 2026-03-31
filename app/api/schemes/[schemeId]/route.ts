import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { deleteLoanScheme } from "@/lib/server/schemes";

export const runtime = "nodejs";

export async function DELETE(_: Request, context: RouteContext<"/api/schemes/[schemeId]">) {
  try {
    await requireApiSession({ roles: ["admin"] });
    const { schemeId } = await context.params;
    const schemes = await deleteLoanScheme(schemeId);
    return NextResponse.json({ schemes, message: "Scheme deleted successfully." });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete scheme." }, { status: 500 });
  }
}
