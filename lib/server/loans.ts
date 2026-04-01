import { formatDisplayDate, parseAppDate } from "@/lib/date-utils";
import type { CreateLoanPayload, LoanPaymentRecord, LoanRecord } from "@/lib/loans";
import { canAccessCompanyId, type AppSession } from "@/lib/server/auth";
import { postLedgerEntry } from "@/lib/server/ledger";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CompanyRelation = { name: string } | { name: string }[] | null;
type CustomerRelation = {
  id: string;
  customer_code: string;
  full_name: string;
  phone_number: string;
  profile_photo_path: string | null;
  current_address: string | null;
  permanent_address: string | null;
  aadhaar_number: string | null;
  area: string | null;
} | {
  id: string;
  customer_code: string;
  full_name: string;
  phone_number: string;
  profile_photo_path: string | null;
  current_address: string | null;
  permanent_address: string | null;
  aadhaar_number: string | null;
  area: string | null;
}[] | null;

type LoanRow = {
  id: string;
  account_number: string;
  customer_id: string;
  company_id: string;
  loan_date: string;
  loan_type: "cash_loan" | "jewel_loan";
  scheme_name: string | null;
  interest_percent: number | string;
  original_loan_amount: number | string;
  supporting_document_paths: unknown;
  status: "active" | "closed";
  customers: CustomerRelation;
  companies: CompanyRelation;
};

type LoanPaymentRow = {
  id: string;
  loan_id: string;
  payment_date: string;
  payment_from: string;
  payment_upto: string;
  principal_payment: number | string;
  interest_payment: number | string;
  notes: string | null;
};

type LoanJewelRow = {
  id: string;
  loan_id: string;
  jewel_type: string;
  jewel_weight: number | string;
  stone_weight: number | string;
  gold_weight: number | string;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return [] as T[];
  }

  return Array.isArray(value) ? value : [value];
}

function getCustomer(customerRelation: CustomerRelation) {
  return asArray(customerRelation)[0] ?? null;
}

function getCompanyName(companyRelation: CompanyRelation) {
  return asArray(companyRelation)[0]?.name ?? "-";
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toLoanTypeLabel(value: "cash_loan" | "jewel_loan") {
  return value === "jewel_loan" ? "Jewel Loan" : "Cash Loan";
}

function toLoanStatusLabel(value: "active" | "closed") {
  return value === "closed" ? "Closed" : "Active";
}

function toPhotoLabel(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function toDocumentCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function mapPayment(row: LoanPaymentRow): LoanPaymentRecord {
  return {
    id: row.id,
    paymentDate: formatDisplayDate(new Date(`${row.payment_date}T00:00:00`)),
    paymentFrom: formatDisplayDate(new Date(`${row.payment_from}T00:00:00`)),
    paymentUpto: formatDisplayDate(new Date(`${row.payment_upto}T00:00:00`)),
    principalPayment: toNumber(row.principal_payment),
    interestPayment: toNumber(row.interest_payment),
    notes: row.notes ?? undefined,
  };
}

function buildLoanRecord(base: LoanRow, payments: LoanPaymentRow[], jewelItems: LoanJewelRow[]): LoanRecord {
  const customer = getCustomer(base.customers);

  if (!customer) {
    throw new Error(`Customer relation missing for loan ${base.id}.`);
  }

  return {
    id: base.id,
    accountNumber: base.account_number,
    customerCode: customer.customer_code,
    customerName: customer.full_name,
    phoneNumber: customer.phone_number,
    customerPhotoLabel: toPhotoLabel(customer.full_name),
    currentAddress: customer.current_address ?? "-",
    permanentAddress: customer.permanent_address ?? "-",
    aadhaarNumber: customer.aadhaar_number ?? "-",
    area: customer.area ?? "-",
    loanType: toLoanTypeLabel(base.loan_type),
    company: getCompanyName(base.companies),
    loanDate: formatDisplayDate(new Date(`${base.loan_date}T00:00:00`)),
    schemeName: base.scheme_name ?? "Manual",
    interestPercent: toNumber(base.interest_percent),
    originalLoanAmount: toNumber(base.original_loan_amount),
    supportingDocumentCount: toDocumentCount(base.supporting_document_paths),
    status: toLoanStatusLabel(base.status),
    jewelDetails: jewelItems.length
      ? jewelItems.map((item) => ({
          id: item.id,
          jewelType: item.jewel_type,
          jewelWeight: toNumber(item.jewel_weight).toFixed(3),
          stoneWeight: toNumber(item.stone_weight).toFixed(3),
          goldWeight: toNumber(item.gold_weight).toFixed(3),
        }))
      : undefined,
    payments: payments.map(mapPayment),
  };
}

function parseAccountNumber(accountNumber: string) {
  const match = accountNumber.trim().match(/^(\d{4})-(\d{4})\/(\d+)$/);

  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  const sequence = Number(match[3]);

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || !Number.isFinite(sequence) || endYear !== startYear + 1) {
    return null;
  }

  return {
    financialYearStart: startYear,
    financialYearLabel: `${startYear}-${endYear}`,
    sequence,
  };
}

async function fetchLoanRows(session: AppSession) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("loans")
    .select(`
      id,
      account_number,
      customer_id,
      company_id,
      loan_date,
      loan_type,
      scheme_name,
      interest_percent,
      original_loan_amount,
      supporting_document_paths,
      status,
      customers!inner(
        id,
        customer_code,
        full_name,
        phone_number,
        profile_photo_path,
        current_address,
        permanent_address,
        aadhaar_number,
        area
      ),
      companies!inner(name)
    `)
    .order("loan_date", { ascending: false })
    .limit(250);

  if (session.role !== "admin") {
    if (!session.companies.length) {
      return [] as LoanRow[];
    }
    query = query.in("company_id", session.companies.map((company) => company.id));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LoanRow[];
}

export async function listLoans(session: AppSession) {
  const loans = await fetchLoanRows(session);
  const loanIds = loans.map((loan) => loan.id);
  const supabase = getSupabaseServerClient();
  const paymentsByLoanId = new Map<string, LoanPaymentRow[]>();
  const jewelItemsByLoanId = new Map<string, LoanJewelRow[]>();

  if (loanIds.length) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("loan_payments")
      .select("id, loan_id, payment_date, payment_from, payment_upto, principal_payment, interest_payment, notes")
      .in("loan_id", loanIds)
      .order("payment_date", { ascending: true });

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }

    for (const payment of (paymentsData ?? []) as LoanPaymentRow[]) {
      const current = paymentsByLoanId.get(payment.loan_id) ?? [];
      current.push(payment);
      paymentsByLoanId.set(payment.loan_id, current);
    }

    const { data: jewelData, error: jewelError } = await supabase
      .from("loan_jewel_items")
      .select("id, loan_id, jewel_type, jewel_weight, stone_weight, gold_weight")
      .in("loan_id", loanIds)
      .order("line_no", { ascending: true });

    if (jewelError) {
      throw new Error(jewelError.message);
    }

    for (const jewelItem of (jewelData ?? []) as LoanJewelRow[]) {
      const current = jewelItemsByLoanId.get(jewelItem.loan_id) ?? [];
      current.push(jewelItem);
      jewelItemsByLoanId.set(jewelItem.loan_id, current);
    }
  }

  return loans.map((loan) => buildLoanRecord(loan, paymentsByLoanId.get(loan.id) ?? [], jewelItemsByLoanId.get(loan.id) ?? []));
}

export async function getLoanDetailById(session: AppSession, loanId: string) {
  const loans = await fetchLoanRows(session);
  const loan = loans.find((item) => item.id === loanId);
  if (!loan) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const [{ data: paymentsData, error: paymentsError }, { data: jewelData, error: jewelError }] = await Promise.all([
    supabase
      .from("loan_payments")
      .select("id, loan_id, payment_date, payment_from, payment_upto, principal_payment, interest_payment, notes")
      .eq("loan_id", loanId)
      .order("payment_date", { ascending: true }),
    supabase
      .from("loan_jewel_items")
      .select("id, loan_id, jewel_type, jewel_weight, stone_weight, gold_weight")
      .eq("loan_id", loanId)
      .order("line_no", { ascending: true }),
  ]);

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  if (jewelError) {
    throw new Error(jewelError.message);
  }

  return buildLoanRecord(loan, (paymentsData ?? []) as LoanPaymentRow[], (jewelData ?? []) as LoanJewelRow[]);
}

export async function createLoan(session: AppSession, payload: CreateLoanPayload) {
  const supabase = getSupabaseServerClient();
  const companyName = payload.companyName.trim();
  const accountNumber = payload.accountNumber.trim();
  const parsedAccount = parseAccountNumber(accountNumber);

  if (!parsedAccount) {
    throw new Error("Account number must follow the format YYYY-YYYY/sequence.");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("name", companyName)
    .maybeSingle();

  if (companyError) {
    throw new Error(companyError.message);
  }

  if (!company) {
    throw new Error("Selected company was not found.");
  }

  if (!canAccessCompanyId(session, company.id as string)) {
    throw new Error("You do not have access to the selected company.");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, company_id, full_name")
    .eq("id", payload.customerId)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (!customer) {
    throw new Error("Selected customer was not found.");
  }

  if (customer.company_id !== company.id) {
    throw new Error("Customer does not belong to the selected company.");
  }

  const { data: duplicateLoan, error: duplicateError } = await supabase
    .from("loans")
    .select("id")
    .eq("account_number", accountNumber)
    .maybeSingle();

  if (duplicateError) {
    throw new Error(duplicateError.message);
  }

  if (duplicateLoan) {
    throw new Error("This account number already exists.");
  }

  const { data: insertedLoan, error: insertError } = await supabase
    .from("loans")
    .insert({
      account_number: accountNumber,
      account_number_sequence: parsedAccount.sequence,
      financial_year_start: parsedAccount.financialYearStart,
      financial_year_label: parsedAccount.financialYearLabel,
      customer_id: payload.customerId,
      company_id: company.id as string,
      loan_date: payload.loanDate,
      loan_type: payload.loanType,
      scheme_name: payload.schemeName?.trim() || null,
      interest_percent: payload.interestPercent,
      original_loan_amount: payload.loanAmount,
      supporting_document_paths: payload.supportingDocuments ?? [],
      created_by: session.userId,
      updated_by: session.userId,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const jewelItems = (payload.jewelItems ?? []).filter((item) => item.jewelType.trim());

  if (payload.loanType === "jewel_loan" && jewelItems.length) {
    const { error: jewelInsertError } = await supabase.from("loan_jewel_items").insert(
      jewelItems.map((item, index) => ({
        loan_id: insertedLoan.id,
        line_no: index + 1,
        jewel_type: item.jewelType.trim(),
        jewel_weight: item.jewelWeight,
        stone_weight: item.stoneWeight,
      })),
    );

    if (jewelInsertError) {
      throw new Error(jewelInsertError.message);
    }
  }

  await postLedgerEntry({
    companyId: company.id as string,
    entryDate: payload.loanDate,
    category: "outgoing_loan",
    direction: "outgoing",
    description: `Loan disbursed for account ${accountNumber}`,
    reference: customer.full_name as string,
    amount: payload.loanAmount,
    sourceType: "loan_disbursal",
    sourceId: insertedLoan.id as string,
    createdBy: session.userId,
    metadata: {
      loanType: payload.loanType,
      accountNumber,
    },
  });

  return getLoanDetailById(session, insertedLoan.id as string);
}

export async function recordLoanPayment(
  session: AppSession,
  loanId: string,
  payload: {
    paymentDate: string;
    paymentFrom: string;
    paymentUpto: string;
    principalPayment: number;
    interestPayment: number;
    notes?: string;
  },
) {
  const supabase = getSupabaseServerClient();
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("id, status, company_id, account_number, customers!inner(full_name)")
    .eq("id", loanId)
    .maybeSingle();

  if (loanError) {
    throw new Error(loanError.message);
  }

  if (!loan) {
    throw new Error("Loan was not found.");
  }

  if (!canAccessCompanyId(session, loan.company_id as string)) {
    throw new Error("You do not have access to this loan.");
  }

  if (loan.status === "closed") {
    throw new Error("Closed loans cannot receive new payments.");
  }

  const { data: paymentRow, error: paymentError } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    payment_date: payload.paymentDate,
    payment_from: payload.paymentFrom,
    payment_upto: payload.paymentUpto,
    principal_payment: payload.principalPayment,
    interest_payment: payload.interestPayment,
    notes: payload.notes?.trim() || null,
    created_by: session.userId,
  }).select("id").single();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  await postLedgerEntry({
    companyId: loan.company_id as string,
    entryDate: payload.paymentDate,
    category: "incoming_payment",
    direction: payload.principalPayment + payload.interestPayment >= 0 ? "incoming" : "outgoing",
    description: `Loan payment received for account ${loan.account_number as string}`,
    reference: asArray(loan.customers)[0]?.full_name ?? "Loan payment",
    amount: Math.abs(payload.principalPayment + payload.interestPayment),
    sourceType: "loan_payment",
    sourceId: paymentRow.id as string,
    createdBy: session.userId,
    metadata: {
      principalPayment: payload.principalPayment,
      interestPayment: payload.interestPayment,
      paymentFrom: payload.paymentFrom,
      paymentUpto: payload.paymentUpto,
    },
  });

  return getLoanDetailById(session, loanId);
}

export async function closeLoan(session: AppSession, loanId: string) {
  const supabase = getSupabaseServerClient();
  const loanRow = await supabase.from("loans").select("company_id").eq("id", loanId).maybeSingle();
  if (loanRow.error) {
    throw new Error(loanRow.error.message);
  }
  if (!loanRow.data || !canAccessCompanyId(session, loanRow.data.company_id as string)) {
    throw new Error("Loan was not found.");
  }

  const loan = await getLoanDetailById(session, loanId);

  if (!loan) {
    throw new Error("Loan was not found.");
  }

  const outstandingPrincipal = Math.max(loan.originalLoanAmount - loan.payments.reduce((total, payment) => total + payment.principalPayment, 0), 0);

  const latestInterestUpto = loan.payments
    .map((payment) => parseAppDate(payment.paymentUpto))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime())
    .at(-1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isInterestCleared = latestInterestUpto ? latestInterestUpto >= today : false;

  if (outstandingPrincipal > 0 || !isInterestCleared) {
    throw new Error("Loan cannot be closed until full principal and upto date interest are paid.");
  }

  const { error: closeError } = await supabase
    .from("loans")
    .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: session.userId, updated_by: session.userId })
    .eq("id", loanId);

  if (closeError) {
    throw new Error(closeError.message);
  }

  return getLoanDetailById(session, loanId);
}



