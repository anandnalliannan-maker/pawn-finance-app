import { NextResponse } from "next/server";

import { deleteLoanScheme } from "@/lib/server/schemes";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ schemeId: string }> },
) {
  try {
    const { schemeId } = await context.params;
    const schemes = await deleteLoanScheme(schemeId);
    return NextResponse.json({ schemes, message: "Scheme deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete scheme." }, { status: 500 });
  }
}
