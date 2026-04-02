import { NextResponse } from "next/server";

import {
  buildCustomerStatus,
  normalizeAadhaar,
  normalizePhoneNumber,
  type CreateCustomerPayload,
} from "@/lib/customers";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { getSignedAttachmentUrl } from "@/lib/server/storage";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CompanyRelation = { name: string } | { name: string }[] | null;

type CustomerSelectRow = {
  id: string;
  customer_code: string;
  full_name: string;
  phone_number: string;
  current_address: string | null;
  permanent_address: string | null;
  area: string | null;
  aadhaar_number: string | null;
  profile_photo_path: string | null;
  company_id: string;
  companies: CompanyRelation;
};

type DuplicateCustomerRow = {
  id: string;
  phone_number_normalized: string | null;
  aadhaar_number_normalized: string | null;
};

function getCompanyName(companies: CompanyRelation) {
  if (Array.isArray(companies)) {
    return companies[0]?.name ?? "-";
  }

  return companies?.name ?? "-";
}

export async function GET() {
  try {
    const session = await requireApiSession();
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("customers")
      .select(`
        id,
        customer_code,
        full_name,
        phone_number,
        current_address,
        permanent_address,
        area,
        aadhaar_number,
        profile_photo_path,
        company_id,
        companies!inner(name)
      `)
      .order("created_at", { ascending: false })
      .limit(250);

    if (session.role !== "admin") {
      if (!session.companies.length) {
        return NextResponse.json({ customers: [] });
      }
      query = query.in("company_id", session.companies.map((company) => company.id));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const customers = await Promise.all(
      ((data ?? []) as CustomerSelectRow[]).map(async (row) => ({
        id: row.id,
        customerCode: row.customer_code,
        fullName: row.full_name,
        phoneNumber: row.phone_number,
        currentAddress: row.current_address ?? "-",
        permanentAddress: row.permanent_address ?? "-",
        area: row.area ?? "-",
        aadhaarNumber: row.aadhaar_number ?? "-",
        profilePhotoPath: row.profile_photo_path,
        profilePhotoUrl: await getSignedAttachmentUrl(row.profile_photo_path),
        company: getCompanyName(row.companies),
        status: buildCustomerStatus({
          profilePhotoPath: row.profile_photo_path,
          aadhaarNumber: row.aadhaar_number,
        }),
      })),
    );

    return NextResponse.json({ customers });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load customers.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = (await request.json()) as CreateCustomerPayload;
    const supabase = getSupabaseServerClient();

    const fullName = payload.fullName?.trim();
    const phoneNumber = payload.phoneNumber?.trim();
    const companyName = payload.companyName?.trim();
    const aadhaarNumber = payload.aadhaarNumber?.trim() || null;

    if (!fullName || !phoneNumber || !companyName) {
      return NextResponse.json(
        { error: "Company, customer name, and phone number are required." },
        { status: 400 },
      );
    }

    if (!canAccessCompanyName(session, companyName)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("name", companyName)
      .maybeSingle();

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    if (!company) {
      return NextResponse.json({ error: "Selected company was not found." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedAadhaar = aadhaarNumber ? normalizeAadhaar(aadhaarNumber) : null;

    const duplicateFilter = normalizedAadhaar
      ? `phone_number_normalized.eq.${normalizedPhone},aadhaar_number_normalized.eq.${normalizedAadhaar}`
      : `phone_number_normalized.eq.${normalizedPhone}`;

    const { data: duplicateCustomers, error: duplicateError } = await supabase
      .from("customers")
      .select("id, phone_number_normalized, aadhaar_number_normalized")
      .or(duplicateFilter);

    if (duplicateError) {
      return NextResponse.json({ error: duplicateError.message }, { status: 500 });
    }

    const existingRows = (duplicateCustomers ?? []) as DuplicateCustomerRow[];
    const phoneExists = existingRows.some((customer) => customer.phone_number_normalized === normalizedPhone);
    const aadhaarExists = normalizedAadhaar
      ? existingRows.some((customer) => customer.aadhaar_number_normalized === normalizedAadhaar)
      : false;

    if (phoneExists || aadhaarExists) {
      return NextResponse.json(
        {
          error: phoneExists
            ? "Customer cannot be saved because the phone number already exists."
            : "Customer cannot be saved because the Aadhaar number already exists.",
        },
        { status: 409 },
      );
    }

    const insertPayload = {
      company_id: company.id as string,
      full_name: fullName,
      phone_number: phoneNumber,
      alternate_phone_number: payload.alternatePhoneNumber?.trim() || null,
      current_address: payload.currentAddress?.trim() || null,
      permanent_address: payload.permanentAddress?.trim() || null,
      aadhaar_number: aadhaarNumber,
      guardian_label: payload.guardianLabel?.trim() || null,
      guardian_name: payload.guardianName?.trim() || null,
      area: payload.area?.trim() || null,
      reference_name: payload.referenceName?.trim() || null,
      remarks: payload.remarks?.trim() || null,
      profile_photo_path: payload.profilePhotoPath?.trim() || null,
      id_proof_document_paths: payload.documentPaths ?? [],
      created_by: session.userId,
      updated_by: session.userId,
    };

    const { data: insertedCustomer, error: insertError } = await supabase
      .from("customers")
      .insert(insertPayload)
      .select(`
        id,
        customer_code,
        full_name,
        phone_number,
        current_address,
        permanent_address,
        area,
        aadhaar_number,
        profile_photo_path,
        company_id,
        companies!inner(name)
      `)
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const customer = insertedCustomer as CustomerSelectRow;

    const { error: auditError } = await supabase.from("customer_audit_log").insert({
      customer_id: customer.id,
      action: "created",
      changed_by: session.userId,
      old_data: null,
      new_data: insertPayload,
    });

    if (auditError) {
      return NextResponse.json({ error: auditError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        customer: {
          id: customer.id,
          customerCode: customer.customer_code,
          fullName: customer.full_name,
          phoneNumber: customer.phone_number,
          currentAddress: customer.current_address ?? "-",
          permanentAddress: customer.permanent_address ?? "-",
          area: customer.area ?? "-",
          aadhaarNumber: customer.aadhaar_number ?? "-",
          profilePhotoPath: customer.profile_photo_path,
          profilePhotoUrl: await getSignedAttachmentUrl(customer.profile_photo_path),
          company: getCompanyName(customer.companies),
          status: buildCustomerStatus({
            profilePhotoPath: customer.profile_photo_path,
            aadhaarNumber: customer.aadhaar_number,
          }),
        },
        message: `Customer ${customer.customer_code} saved successfully.`,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save customer.",
      },
      { status: 500 },
    );
  }
}
