import { NextResponse } from "next/server";

import {
  type CreateCustomerPayload,
  GLOBAL_CUSTOMER_MASTER_LABEL,
  normalizeAadhaar,
  normalizePhoneNumber,
} from "@/lib/customers";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { getSignedAttachmentUrl } from "@/lib/server/storage";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const company = searchParams.get("company")?.trim();

  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("customers")
    .select(
      `
        id,
        customer_code,
        full_name,
        phone_number,
        aadhaar_number,
        area,
        current_address,
        permanent_address,
        guardian_label,
        guardian_name,
        reference_name,
        remarks,
        profile_photo_path,
        company_id,
        companies ( name )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      [
        `full_name.ilike.%${search}%`,
        `phone_number.ilike.%${search}%`,
        `customer_code.ilike.%${search}%`,
        `area.ilike.%${search}%`,
      ].join(","),
    );
  }

  if (company && company.toLowerCase() !== GLOBAL_CUSTOMER_MASTER_LABEL.toLowerCase()) {
    const allowed = canAccessCompanyName(session, company);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    query = query.eq("companies.name", company);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customers = await Promise.all(
    (data ?? []).map(async (row: {
      id: string;
      customer_code: string;
      full_name: string;
      phone_number: string;
      aadhaar_number: string | null;
      area: string | null;
      current_address: string | null;
      permanent_address: string | null;
      guardian_label: string | null;
      guardian_name: string | null;
      reference_name: string | null;
      remarks: string | null;
      profile_photo_path: string | null;
      companies?: { name?: string | null } | Array<{ name?: string | null }> | null;
    }) => {
      const companyName =
        Array.isArray(row.companies) ? (row.companies[0]?.name ?? null) : (row.companies?.name ?? null);

      return {
        id: row.id,
        customerCode: row.customer_code,
        fullName: row.full_name,
        name: row.full_name,
        phoneNumber: row.phone_number,
        phone: row.phone_number,
        aadhaarNumber: row.aadhaar_number ?? "",
        aadhaar: row.aadhaar_number ?? "",
        area: row.area ?? "",
        company: GLOBAL_CUSTOMER_MASTER_LABEL,
        companyName: companyName ?? GLOBAL_CUSTOMER_MASTER_LABEL,
        currentAddress: row.current_address ?? "",
        permanentAddress: row.permanent_address ?? "",
        guardianLabel: row.guardian_label ?? "",
        guardianName: row.guardian_name ?? "",
        referenceName: row.reference_name ?? "",
        remarks: row.remarks ?? "",
        profilePhotoUrl: row.profile_photo_path ? await getSignedAttachmentUrl(row.profile_photo_path) : null,
        photoUrl: row.profile_photo_path ? await getSignedAttachmentUrl(row.profile_photo_path) : null,
        status: row.aadhaar_number ? "Verified profile" : "Pending Aadhaar",
      };
    }),
  );

  return NextResponse.json({ customers });
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

  const payload = (await request.json()) as CreateCustomerPayload;
  const companyName = session.companies[0]?.name ?? payload.companyName?.trim();

  if (!companyName) {
    return NextResponse.json({ error: "No company access configured for this operator." }, { status: 400 });
  }

  const hasAccess = canAccessCompanyName(session, companyName);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fullName = payload.fullName?.trim();
  const phoneNumber = normalizePhoneNumber(payload.phoneNumber ?? "");
  const aadhaarNumber = normalizeAadhaar(payload.aadhaarNumber ?? "");

  if (!fullName || phoneNumber.length < 10) {
    return NextResponse.json({ error: "Customer name and a valid phone number are required." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const companyLookup = await supabase.from("companies").select("id").eq("name", companyName).maybeSingle();
  if (companyLookup.error || !companyLookup.data) {
    return NextResponse.json({ error: "Company not found." }, { status: 400 });
  }

  const duplicateChecks = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .eq("phone_number_normalized", phoneNumber)
      .maybeSingle(),
    aadhaarNumber
      ? supabase
          .from("customers")
          .select("id")
          .eq("aadhaar_number_normalized", aadhaarNumber)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const [phoneDuplicate, aadhaarDuplicate] = duplicateChecks;

  if (phoneDuplicate.error || aadhaarDuplicate.error) {
    return NextResponse.json(
      { error: phoneDuplicate.error?.message ?? aadhaarDuplicate.error?.message ?? "Unable to validate duplicates." },
      { status: 500 },
    );
  }

  if (phoneDuplicate.data) {
    return NextResponse.json({ error: "A customer already exists with this phone number." }, { status: 409 });
  }

  if (aadhaarDuplicate.data) {
    return NextResponse.json({ error: "A customer already exists with this Aadhaar number." }, { status: 409 });
  }

  const insertResult = await supabase
    .from("customers")
    .insert({
      company_id: companyLookup.data.id,
      full_name: fullName,
      phone_number: phoneNumber,
      alternate_phone_number: normalizePhoneNumber(payload.alternatePhoneNumber ?? "") || null,
      current_address: payload.currentAddress?.trim() || null,
      permanent_address: payload.permanentAddress?.trim() || null,
      aadhaar_number: aadhaarNumber || null,
      guardian_label: payload.guardianLabel?.trim() || null,
      guardian_name: payload.guardianName?.trim() || null,
      area: payload.area?.trim() || null,
      reference_name: payload.referenceName?.trim() || null,
      remarks: payload.remarks?.trim() || null,
      profile_photo_path: payload.profilePhotoPath || null,
      id_proof_document_paths: payload.documentPaths ?? {},
      created_by: session.userId,
      updated_by: session.userId,
    })
    .select(
      `
        id,
        customer_code,
        full_name,
        phone_number,
        aadhaar_number,
        area,
        current_address,
        permanent_address,
        guardian_label,
        guardian_name,
        reference_name,
        remarks,
        profile_photo_path,
        id_proof_document_paths,
        companies ( name )
      `,
    )
    .single();

  if (insertResult.error) {
    if (insertResult.error.code === "23505") {
      return NextResponse.json({ error: "Customer already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
  }

  await supabase.from("customer_audit_log").insert({
    customer_id: insertResult.data.id,
    action: "created",
    changed_by: session.userId,
    new_data: insertResult.data,
  });

  return NextResponse.json(
    {
      customer: {
        id: insertResult.data.id,
        customerCode: insertResult.data.customer_code,
        name: insertResult.data.full_name,
        phone: insertResult.data.phone_number,
        aadhaar: insertResult.data.aadhaar_number ?? "",
        area: insertResult.data.area ?? "",
        company: GLOBAL_CUSTOMER_MASTER_LABEL,
        currentAddress: insertResult.data.current_address ?? "",
        permanentAddress: insertResult.data.permanent_address ?? "",
        guardianLabel: insertResult.data.guardian_label ?? "",
        guardianName: insertResult.data.guardian_name ?? "",
        referenceName: insertResult.data.reference_name ?? "",
        remarks: insertResult.data.remarks ?? "",
        photoUrl: insertResult.data.profile_photo_path
          ? await getSignedAttachmentUrl(insertResult.data.profile_photo_path)
          : null,
        idProofDocumentPaths: insertResult.data.id_proof_document_paths ?? {},
      },
    },
    { status: 201 },
  );
}
