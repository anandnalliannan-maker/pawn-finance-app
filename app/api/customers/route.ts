import { NextResponse } from "next/server";

import {
  buildCustomerStatus,
  normalizeAadhaar,
  normalizePhoneNumber,
  type CreateCustomerPayload,
} from "@/lib/customers";
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
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
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
        companies!inner(name)
      `)
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const customers = ((data ?? []) as CustomerSelectRow[]).map((row) => ({
      id: row.id,
      customerCode: row.customer_code,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      currentAddress: row.current_address ?? "-",
      permanentAddress: row.permanent_address ?? "-",
      area: row.area ?? "-",
      aadhaarNumber: row.aadhaar_number ?? "-",
      profilePhotoPath: row.profile_photo_path,
      company: getCompanyName(row.companies),
      status: buildCustomerStatus({
        profilePhotoPath: row.profile_photo_path,
        aadhaarNumber: row.aadhaar_number,
      }),
    }));

    return NextResponse.json({ customers });
  } catch (error) {
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
    const phoneExists = existingRows.some(
      (customer) => customer.phone_number_normalized === normalizedPhone,
    );
    const aadhaarExists = normalizedAadhaar
      ? existingRows.some(
          (customer) => customer.aadhaar_number_normalized === normalizedAadhaar,
        )
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save customer.",
      },
      { status: 500 },
    );
  }
}
