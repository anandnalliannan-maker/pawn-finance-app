import { NextResponse } from "next/server";

import { logoutCurrentUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  await logoutCurrentUser();
  return NextResponse.json({ message: "Logged out." });
}
