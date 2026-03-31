import { NextResponse } from "next/server";

import { loginWithUsernamePassword } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { username?: string; password?: string };

    if (!payload.username?.trim() || !payload.password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const session = await loginWithUsernamePassword(payload.username, payload.password);

    return NextResponse.json({
      message: "Login successful.",
      companies: session.companies,
      role: session.role,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to login." },
      { status: 401 },
    );
  }
}
