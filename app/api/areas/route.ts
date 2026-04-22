import { NextResponse } from "next/server";

import { buildAuthErrorResponse, requireApiSession } from "@/lib/server/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalizeAreaName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function GET() {
  try {
    await requireApiSession();
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const [areaMasterResult, customerAreaResult] = await Promise.all([
    supabase.from("area_master").select("name").order("name", { ascending: true }),
    supabase.from("customers").select("area").not("area", "is", null),
  ]);

  if (areaMasterResult.error) {
    return NextResponse.json({ error: areaMasterResult.error.message }, { status: 500 });
  }

  if (customerAreaResult.error) {
    return NextResponse.json({ error: customerAreaResult.error.message }, { status: 500 });
  }

  const names = new Map<string, string>();

  for (const row of areaMasterResult.data ?? []) {
    const normalized = normalizeAreaName(row.name ?? "");
    if (normalized) {
      names.set(normalized.toLowerCase(), normalized);
    }
  }

  for (const row of customerAreaResult.data ?? []) {
    const normalized = normalizeAreaName(row.area ?? "");
    if (normalized) {
      names.set(normalized.toLowerCase(), normalized);
    }
  }

  return NextResponse.json({
    items: Array.from(names.values()).sort((left, right) => left.localeCompare(right)),
  });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireApiSession();
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { name?: string } | null;
  const normalizedName = normalizeAreaName(payload?.name ?? "");

  if (!normalizedName) {
    return NextResponse.json({ error: "Area name is required." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("area_master")
    .insert({
      name: normalizedName,
      name_normalized: normalizedName.toLowerCase(),
      created_by: session.userId,
    })
    .select("name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Area already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
