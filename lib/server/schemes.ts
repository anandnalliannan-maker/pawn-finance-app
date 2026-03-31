import type { LoanScheme, SaveLoanSchemePayload } from "@/lib/schemes";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SchemeRow = {
  id: string;
  code: string;
  name: string;
  companies: { name: string } | { name: string }[] | null;
};
type SlabRow = {
  id: string;
  scheme_id: string;
  start_day: number | string;
  end_day: number | string | null;
  interest_percent: number | string;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) return [] as T[];
  return Array.isArray(value) ? value : [value];
}
function asNumberString(value: number | string | null | undefined) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? String(parsed) : "";
}

export async function listLoanSchemes() {
  const supabase = getSupabaseServerClient();
  const { data: schemesData, error: schemesError } = await supabase
    .from("loan_schemes")
    .select("id, code, name, companies!inner(name)")
    .order("created_at", { ascending: true });

  if (schemesError) throw new Error(schemesError.message);
  const schemes = (schemesData ?? []) as SchemeRow[];

  const schemeIds = schemes.map((scheme) => scheme.id);
  const slabsBySchemeId = new Map<string, SlabRow[]>();

  if (schemeIds.length) {
    const { data: slabsData, error: slabsError } = await supabase
      .from("loan_scheme_slabs")
      .select("id, scheme_id, start_day, end_day, interest_percent")
      .in("scheme_id", schemeIds)
      .order("line_no", { ascending: true });

    if (slabsError) throw new Error(slabsError.message);

    for (const slab of (slabsData ?? []) as SlabRow[]) {
      const current = slabsBySchemeId.get(slab.scheme_id) ?? [];
      current.push(slab);
      slabsBySchemeId.set(slab.scheme_id, current);
    }
  }

  return schemes.map<LoanScheme>((scheme) => ({
    id: scheme.id,
    code: scheme.code,
    name: scheme.name,
    company: asArray(scheme.companies)[0]?.name ?? "-",
    slabs: (slabsBySchemeId.get(scheme.id) ?? []).map((slab) => ({
      id: slab.id,
      startDay: asNumberString(slab.start_day),
      endDay: slab.end_day == null ? "" : asNumberString(slab.end_day),
      interestPercent: asNumberString(slab.interest_percent),
    })),
  }));
}

export async function saveLoanScheme(payload: SaveLoanSchemePayload) {
  const supabase = getSupabaseServerClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("name", payload.companyName)
    .maybeSingle();

  if (companyError) throw new Error(companyError.message);
  if (!company) throw new Error("Selected company was not found.");

  let schemeId = payload.id;
  const code = payload.code?.trim() || `${payload.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

  if (schemeId) {
    const { error } = await supabase
      .from("loan_schemes")
      .update({ name: payload.name.trim(), company_id: company.id, code })
      .eq("id", schemeId);
    if (error) throw new Error(error.message);

    const { error: deleteError } = await supabase.from("loan_scheme_slabs").delete().eq("scheme_id", schemeId);
    if (deleteError) throw new Error(deleteError.message);
  } else {
    const { data: inserted, error } = await supabase
      .from("loan_schemes")
      .insert({ company_id: company.id, code, name: payload.name.trim() })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    schemeId = inserted.id as string;
  }

  const slabs = payload.slabs.filter((slab) => slab.startDay > 0);
  if (slabs.length) {
    const { error: slabError } = await supabase.from("loan_scheme_slabs").insert(
      slabs.map((slab, index) => ({
        scheme_id: schemeId,
        line_no: index + 1,
        start_day: slab.startDay,
        end_day: slab.endDay ?? null,
        interest_percent: slab.interestPercent,
      })),
    );
    if (slabError) throw new Error(slabError.message);
  }

  return listLoanSchemes();
}

export async function deleteLoanScheme(schemeId: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("loan_schemes").delete().eq("id", schemeId);
  if (error) throw new Error(error.message);
  return listLoanSchemes();
}
