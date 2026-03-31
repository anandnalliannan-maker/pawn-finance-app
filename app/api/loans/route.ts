import { NextResponse } from "next/server";

import type { CreateLoanPayload } from "@/lib/loans";
import { createLoan, listLoans } from "@/lib/server/loans";

export const runtime = "nodejs";

export async function GET() {
  try {
    const loans = await listLoans();
    return NextResponse.json({ loans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load loans." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateLoanPayload;

    if (!payload.companyName?.trim() || !payload.customerId?.trim()) {
      return NextResponse.json(
        { error: "Company and customer are required." },
        { status: 400 },
      );
    }

    if (!payload.accountNumber?.trim() || !payload.loanDate || !payload.loanType) {
      return NextResponse.json(
        { error: "Account number, loan date, and loan type are required." },
        { status: 400 },
      );
    }

    if (!(payload.loanAmount > 0)) {
      return NextResponse.json(
        { error: "Loan amount must be greater than zero." },
        { status: 400 },
      );
    }

    const loan = await createLoan(payload);
    return NextResponse.json(
      {
        loan,
        message: `Loan ${loan?.accountNumber ?? payload.accountNumber} saved successfully.`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save loan." },
      { status: 500 },
    );
  }
}
