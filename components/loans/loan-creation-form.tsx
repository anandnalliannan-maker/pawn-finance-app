/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Paperclip, Plus, Save, Search, Sparkles, Trash2, UserRound, X } from "lucide-react";

import type { CustomerListItem } from "@/lib/customers";
import {
  calculateSimpleInterestForRange,
  formatIsoDate,
  getDaysInMonth,
  parseAppDate,
  toDisplayDateFromIso,
} from "@/lib/date-utils";
import type { CreateLoanPayload, LoanRecord } from "@/lib/loans";
import {
  buildHighestSequenceMap,
  getLoanAccountSeriesPrefix,
  getSequenceFromAccountNumber,
} from "@/lib/loan-account-number";
import { sourceAccounts } from "@/lib/source-accounts";
import { calculateSchemeInterestForRange, resolveSchemeInterestPercent, type LoanScheme } from "@/lib/schemes";
import { MAX_DOCUMENT_SIZE_BYTES, MAX_LOAN_ATTACHMENTS, uploadSelectedFiles } from "@/lib/uploads";

type LoanCreationFormProps = {
  selectedCompany: string;
};

type LoanSummary = {
  accountNumber: string;
  customerName: string;
  company: string;
  loanType: string;
  originalLoanAmount: number;
  loanDate: string;
  schemeName: string;
};

type JewelRow = {
  id: number;
  jewelType: string;
  jewelWeight: string;
  stoneWeight: string;
};

function getDefaultLoanType(companyName: string): "cash_loan" | "jewel_loan" {
  return companyName === "Vishnu Bankers" ? "jewel_loan" : "cash_loan";
}

function buildJewelRow(id: number): JewelRow {
  return {
    id,
    jewelType: "",
    jewelWeight: "",
    stoneWeight: "",
  };
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getGoldWeight(row: JewelRow) {
  const goldWeight = toNumber(row.jewelWeight) - toNumber(row.stoneWeight);
  return goldWeight > 0 ? goldWeight.toFixed(3) : "0.000";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatBytesLabel(value: number) {
  return `${Math.round(value / 1024)} KB`;
}

export function LoanCreationForm({ selectedCompany }: LoanCreationFormProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [existingLoans, setExistingLoans] = useState<LoanRecord[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCustomerCode, setSearchCustomerCode] = useState("");
  const [loanDate, setLoanDate] = useState(formatIsoDate(new Date()));
  const [loanType, setLoanType] = useState<"cash_loan" | "jewel_loan">(getDefaultLoanType(selectedCompany));
  const [loanAmount, setLoanAmount] = useState("50000");
  const [scheme, setScheme] = useState("");
  const [interestPercent, setInterestPercent] = useState("1.00");
  const [sequenceMap, setSequenceMap] = useState<Record<string, number>>({});
  const [availableSchemes, setAvailableSchemes] = useState<LoanScheme[]>([]);
  const [accountSequenceInput, setAccountSequenceInput] = useState("");
  const [accountError, setAccountError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading customer and loan data from Supabase...");
  const [accountWasEdited, setAccountWasEdited] = useState(false);
  const [jewelRows, setJewelRows] = useState<JewelRow[]>([buildJewelRow(1)]);
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
  const [supportingDocumentFiles, setSupportingDocumentFiles] = useState<File[]>([]);
  const [sourceAccount, setSourceAccount] = useState<(typeof sourceAccounts)[number]>("Cash in Hand");
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<LoanSummary | null>(null);

  useEffect(() => {
    setLoanType(getDefaultLoanType(selectedCompany));
  }, [selectedCompany]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [customerResponse, loanResponse, schemeResponse] = await Promise.all([
          fetch("/api/customers", { cache: "no-store" }),
          fetch("/api/loans", { cache: "no-store" }),
          fetch("/api/schemes", { cache: "no-store" }),
        ]);

        const customerResult = await customerResponse.json();
        const loanResult = await loanResponse.json();
        const schemeResult = await schemeResponse.json();

        if (!isMounted) {
          return;
        }

        if (!customerResponse.ok) {
          setStatusMessage(customerResult.error ?? "Unable to load customers.");
          return;
        }

        if (!loanResponse.ok) {
          setStatusMessage(loanResult.error ?? "Unable to load loans.");
          return;
        }

        if (!schemeResponse.ok) {
          setStatusMessage(schemeResult.error ?? "Unable to load schemes.");
          return;
        }

        const nextCustomers = (customerResult.customers ?? []) as CustomerListItem[];
        const nextLoans = (loanResult.loans ?? []) as LoanRecord[];
        const nextSchemes = (schemeResult.schemes ?? []) as LoanScheme[];
        setCustomers(nextCustomers);
        setExistingLoans(nextLoans);
        setAvailableSchemes(nextSchemes);
        setSequenceMap(buildHighestSequenceMap(nextLoans.map((loan) => loan.accountNumber)));
        setStatusMessage("Loan form is connected to Supabase. Customer lookup, scheme lookup, and loan save are live.");
      } catch {
        if (isMounted) {
          setStatusMessage("Unable to reach the loan setup endpoints.");
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCompany]);

  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => {
      const matchesName = searchName
        ? customer.fullName.toLowerCase().includes(searchName.toLowerCase())
        : true;
      const matchesPhone = searchPhone
        ? customer.phoneNumber.replace(/\s+/g, "").includes(searchPhone.replace(/\s+/g, ""))
        : true;
      const matchesCode = searchCustomerCode
        ? customer.customerCode.includes(searchCustomerCode)
        : true;

      return matchesName && matchesPhone && matchesCode;
    }) ?? null;
  }, [customers, searchCustomerCode, searchName, searchPhone]);

  const selectedScheme = useMemo(() => availableSchemes.find((item) => item.id === scheme) ?? null, [availableSchemes, scheme]);

  const accountSeriesPrefix = getLoanAccountSeriesPrefix(selectedCompany, loanDate);
  const generatedSequence = String((sequenceMap[accountSeriesPrefix] ?? 0) + 1);
  const currentSequenceValue = accountWasEdited ? accountSequenceInput : generatedSequence;
  const currentAccountNumber = currentSequenceValue ? `${accountSeriesPrefix}-${currentSequenceValue}` : `${accountSeriesPrefix}-`;
  const existingLoanNumbers = useMemo(() => existingLoans.map((loan) => loan.accountNumber), [existingLoans]);

  const nextAutoSequence = useMemo(() => {
    const currentSequence = currentSequenceValue ? Number(currentSequenceValue) : 0;
    const highestExisting = sequenceMap[accountSeriesPrefix] ?? 0;
    return Math.max(currentSequence, highestExisting) + 1;
  }, [accountSeriesPrefix, currentSequenceValue, sequenceMap]);

  const daysInSelectedMonth = useMemo(() => getDaysInMonth(loanDate), [loanDate]);
  const schemeBasedInterestPercent = useMemo(
    () => resolveSchemeInterestPercent(selectedScheme, daysInSelectedMonth),
    [daysInSelectedMonth, selectedScheme],
  );
  const effectiveInterestPercent = scheme ? schemeBasedInterestPercent ?? 0 : Number(interestPercent) || 0;

  const monthlyInterest = useMemo(() => {
    const loanDateValue = parseAppDate(loanDate);
    if (Number.isNaN(loanDateValue.getTime())) {
      return 0;
    }

    const monthStart = formatIsoDate(new Date(loanDateValue.getFullYear(), loanDateValue.getMonth(), 1));
    const monthEnd = formatIsoDate(new Date(loanDateValue.getFullYear(), loanDateValue.getMonth() + 1, 0));

    if (selectedScheme) {
      return calculateSchemeInterestForRange(Number(loanAmount) || 0, selectedScheme, monthStart, monthEnd).amount;
    }

    const rangeInterest = calculateSimpleInterestForRange(
      Number(loanAmount) || 0,
      Number(interestPercent) || 0,
      monthStart,
      monthEnd,
    );
    return rangeInterest.amount;
  }, [interestPercent, loanAmount, loanDate, selectedScheme]);
  const yearlyInterestPercent = useMemo(() => effectiveInterestPercent * 12, [effectiveInterestPercent]);

  function handleAccountSequenceChange(value: string) {
    const digitsOnly = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");

    setAccountWasEdited(true);
    setAccountSequenceInput(digitsOnly);

    if (!digitsOnly) {
      setAccountError("");
      return;
    }

    const normalized = `${accountSeriesPrefix}-${digitsOnly}`;
    if (existingLoanNumbers.includes(normalized)) {
      setAccountError("This account number already exists.");
    } else {
      setAccountError("");
    }
  }

  function handleLoanDateChange(value: string) {
    setLoanDate(value);
    setAccountWasEdited(false);
    setAccountSequenceInput("");
    setAccountError("");
  }

  function handleSchemeChange(value: string) {
    setScheme(value);
    if (!value) {
      setInterestPercent("1.00");
    }
  }

  function handleDocumentSelection(files: File[]) {
    if (files.length > MAX_LOAN_ATTACHMENTS) {
      setStatusMessage(`Only ${MAX_LOAN_ATTACHMENTS} attachments are allowed for a loan.`);
      return;
    }

    const invalidFile = files.find((file) => file.size > MAX_DOCUMENT_SIZE_BYTES);
    if (invalidFile) {
      setStatusMessage(`Each document must be ${formatBytesLabel(MAX_DOCUMENT_SIZE_BYTES)} or smaller.`);
      return;
    }

    setSupportingDocumentFiles(files);
    setSupportingDocuments(files.map((file) => file.name));
    setStatusMessage(files.length ? "Loan attachments selected." : "Loan form is connected to Supabase. Customer lookup, scheme lookup, and loan save are live.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer) {
      setStatusMessage("Select a saved customer before creating a loan.");
      return;
    }

    if (!currentSequenceValue) {
      const message = "Enter a valid account number sequence.";
      setAccountError(message);
      setStatusMessage(message);
      return;
    }

    if (existingLoanNumbers.includes(currentAccountNumber)) {
      const message = "Duplicate account number found. Please use a different account number.";
      setAccountError(message);
      setStatusMessage(message);
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving loan to Supabase...");

    try {
      const uploadedDocumentPaths = supportingDocumentFiles.length
        ? await uploadSelectedFiles("loan-document", selectedCompany, supportingDocumentFiles)
        : [];

      const payload: CreateLoanPayload = {
        companyName: selectedCompany,
        customerId: selectedCustomer.id,
        accountNumber: currentAccountNumber,
        loanDate,
        loanType,
        loanAmount: Number(loanAmount) || 0,
        schemeName: selectedScheme?.name || undefined,
        interestPercent: effectiveInterestPercent,
        sourceAccount,
        supportingDocuments: uploadedDocumentPaths,
        jewelItems:
          loanType === "jewel_loan"
            ? jewelRows
                .filter((row) => row.jewelType.trim())
                .map((row) => ({
                  jewelType: row.jewelType.trim(),
                  jewelWeight: Number(row.jewelWeight) || 0,
                  stoneWeight: Number(row.stoneWeight) || 0,
                }))
            : [],
      };

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save loan.");
        return;
      }

      const savedLoan = result.loan as LoanRecord | null;
      if (savedLoan) {
        setExistingLoans((current) => [savedLoan, ...current]);
        setSummary({
          accountNumber: savedLoan.accountNumber,
          customerName: savedLoan.customerName,
          company: savedLoan.company,
          loanType: savedLoan.loanType,
          originalLoanAmount: savedLoan.originalLoanAmount,
          loanDate: savedLoan.loanDate,
          schemeName: savedLoan.schemeName,
        });
        const editedSequence = getSequenceFromAccountNumber(savedLoan.accountNumber, accountSeriesPrefix);
        if (editedSequence) {
          setSequenceMap((current) => ({
            ...current,
            [accountSeriesPrefix]: Math.max(current[accountSeriesPrefix] ?? 0, editedSequence),
          }));
        }
      }

      setLoanType(getDefaultLoanType(selectedCompany));
      setLoanAmount("50000");
      setScheme("");
      setInterestPercent("1.00");
      setAccountWasEdited(false);
      setAccountSequenceInput("");
      setAccountError("");
      setJewelRows([buildJewelRow(1)]);
      setSupportingDocuments([]);
      setSupportingDocumentFiles([]);
      setSourceAccount("Cash in Hand");
      setStatusMessage(result.message ?? "Loan saved successfully.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to reach the loan save endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  function addJewelRow() {
    setJewelRows((current) => (current.length >= 5 ? current : [...current, buildJewelRow(current.length + 1)]));
  }

  function removeJewelRow(id: number) {
    setJewelRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  }

  function updateJewelRow(id: number, field: keyof JewelRow, value: string) {
    setJewelRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Customer Details</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Create new loan</h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.24fr_0.76fr]">
          <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-5 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-[24px] bg-[var(--color-panel-strong)] text-2xl font-semibold text-[var(--color-accent-strong)]">
              {selectedCustomer?.profilePhotoUrl ? (
                <img src={selectedCustomer.profilePhotoUrl} alt={selectedCustomer.fullName} className="h-full w-full object-cover" />
              ) : selectedCustomer ? (
                getInitials(selectedCustomer.fullName)
              ) : (
                <UserRound className="h-10 w-10" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">Customer Photo</p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">Global customer master lookup</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-muted)]">Customer Name</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                <Search className="h-4 w-4 text-[var(--color-muted)]" />
                <input value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="Type customer name" className="w-full bg-transparent outline-none" />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-muted)]">Phone Number</span>
              <input value={searchPhone} onChange={(event) => setSearchPhone(event.target.value)} placeholder="Type phone number" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-muted)]">Customer ID</span>
              <input value={searchCustomerCode} onChange={(event) => setSearchCustomerCode(event.target.value)} placeholder="Type customer ID" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" />
            </label>

            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Matched Customer</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.fullName ?? "No customer matched"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Saved Phone</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.phoneNumber ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Customer Master</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.company ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Current Address</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.currentAddress ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2 xl:col-span-1"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Permanent Address</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.permanentAddress ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2 xl:col-span-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Aadhaar / Area</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer ? `${selectedCustomer.aadhaarNumber ?? "-"}  |  ${selectedCustomer.area}` : "-"}</p></div>
          </div>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Loan Details</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Acc no.</span>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <input value={`${accountSeriesPrefix}-`} readOnly className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]" />
              <input value={currentSequenceValue} onChange={(event) => handleAccountSequenceChange(event.target.value)} inputMode="numeric" placeholder="Sequence" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" />
            </div>
            <p className="text-xs text-[var(--color-muted)]">Financial year and company prefix are fixed. Only the numeric sequence can be edited.</p>
            {accountError ? <p className="text-sm text-red-600">{accountError}</p> : <p className="text-xs text-[var(--color-muted)]">Next auto number: {`${accountSeriesPrefix}-${nextAutoSequence}`}</p>}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Date</span>
            <input type="date" value={loanDate} onChange={(event) => handleLoanDateChange(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Loan Type</span>
            <select value={loanType} onChange={(event) => setLoanType(event.target.value as "cash_loan" | "jewel_loan")} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">
              <option value="cash_loan">Cash</option>
              <option value="jewel_loan">Jewel</option>
            </select>
          </label>

          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Company</span><input value={selectedCompany} readOnly className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Loan Amount</span><input value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Scheme</span><select value={scheme} onChange={(event) => handleSchemeChange(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"><option value="">Select later</option>{availableSchemes.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}</select></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest %</span><input value={scheme ? (schemeBasedInterestPercent ? schemeBasedInterestPercent.toFixed(2) : "") : interestPercent} onChange={(event) => setInterestPercent(event.target.value)} readOnly={Boolean(scheme)} className={`w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 outline-none transition focus:border-[var(--color-accent)] ${scheme ? "bg-[var(--color-page)] text-[var(--color-muted)]" : "bg-white"}`} /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Disbursal source</span><select value={sourceAccount} onChange={(event) => setSourceAccount(event.target.value as (typeof sourceAccounts)[number])} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">{sourceAccounts.map((item) => (<option key={item} value={item}>{item}</option>))}</select></label>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Interest per month</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">Rs {monthlyInterest.toFixed(2)}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{scheme ? `Scheme slab applied for ${daysInSelectedMonth} day(s).` : `Simple interest for ${daysInSelectedMonth} days in selected month`}</p></div>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Interest % per year</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{yearlyInterestPercent.toFixed(2)}%</p><p className="mt-1 text-xs text-[var(--color-muted)]">Annualized from current monthly rate or matched scheme slab.</p></div>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Selected loan date</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{toDisplayDateFromIso(loanDate)}</p></div>
        </div>
      </section>

      {loanType === "jewel_loan" ? (
        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Jewel Details</p><p className="mt-2 text-sm text-[var(--color-muted)]">Add up to 5 rows</p></div>
            <button type="button" onClick={addJewelRow} disabled={jewelRows.length >= 5} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add row</button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white"><thead><tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]"><th className="px-4 py-3 font-semibold">Jewel Type</th><th className="px-4 py-3 font-semibold">Jewel wt.</th><th className="px-4 py-3 font-semibold">Stone wt.</th><th className="px-4 py-3 font-semibold">Gold wt.</th><th className="px-4 py-3 font-semibold">Action</th></tr></thead><tbody>{jewelRows.map((row) => (<tr key={row.id} className="border-t border-[var(--color-border)]"><td className="px-4 py-3"><input value={row.jewelType} onChange={(event) => updateJewelRow(row.id, "jewelType", event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none" /></td><td className="px-4 py-3"><input value={row.jewelWeight} onChange={(event) => updateJewelRow(row.id, "jewelWeight", event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none" /></td><td className="px-4 py-3"><input value={row.stoneWeight} onChange={(event) => updateJewelRow(row.id, "stoneWeight", event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none" /></td><td className="px-4 py-3"><input value={getGoldWeight(row)} readOnly className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-[var(--color-muted)]" /></td><td className="px-4 py-3"><button type="button" onClick={() => removeJewelRow(row.id)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)]"><Trash2 className="h-4 w-4" />Remove</button></td></tr>))}</tbody></table>
          </div>
        </section>
      ) : null}

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[var(--color-ink)]"><Paperclip className="h-4 w-4 text-[var(--color-accent)]" /><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Supporting Documents</p></div>
        <input type="file" multiple accept="image/*,.pdf" onChange={(event) => handleDocumentSelection(Array.from(event.target.files ?? []))} className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]" />
        <p className="mt-3 text-xs text-[var(--color-muted)]">Maximum 3 files. Each file must be 500 KB or smaller.</p>
        {supportingDocuments.length ? <p className="mt-3 text-sm text-[var(--color-muted)]">{supportingDocuments.join(", ")}</p> : null}
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 text-sm text-[var(--color-muted)]"><AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" /><p className="max-w-3xl leading-7">{statusMessage}</p></div>
          <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Loan  F4"}</button>
        </div>
      </section>
      </form>

      {summary ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4"><div className="w-full max-w-2xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Loan Saved</p><h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{summary.accountNumber}</h2><p className="mt-2 text-sm text-[var(--color-muted)]">This is a quick confirmation summary for staff reference.</p></div><button type="button" onClick={() => setSummary(null)} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]" aria-label="Close loan summary"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><SummaryCard label="Customer" value={summary.customerName} /><SummaryCard label="Company" value={summary.company} /><SummaryCard label="Loan type" value={summary.loanType} /><SummaryCard label="Loan date" value={summary.loanDate} /><SummaryCard label="Original loan" value={`Rs ${summary.originalLoanAmount.toFixed(2)}`} /><SummaryCard label="Scheme" value={summary.schemeName || "Manual"} /></div><div className="mt-6 flex justify-end"><button type="button" onClick={() => setSummary(null)} className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]">Close</button></div></div></div> : null}
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{value}</p></div>;
}


