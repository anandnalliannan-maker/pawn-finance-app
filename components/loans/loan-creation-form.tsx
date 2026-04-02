"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Paperclip, Plus, Save, Search, Sparkles, Trash2, UserRound } from "lucide-react";

import type { CustomerListItem } from "@/lib/customers";
import { calculateSimpleInterestForRange, formatIsoDate, getDaysInMonth, parseAppDate, toDisplayDateFromIso } from "@/lib/date-utils";
import type { CreateLoanPayload, LoanRecord } from "@/lib/loans";
import { sourceAccounts } from "@/lib/source-accounts";
import type { LoanScheme } from "@/lib/schemes";

type LoanCreationFormProps = {
  selectedCompany: string;
};

type JewelRow = {
  id: number;
  jewelType: string;
  jewelWeight: string;
  stoneWeight: string;
};


function getFinancialYearPrefix(value: string) {
  const date = parseAppDate(value);
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function buildHighestSequenceMap(numbers: string[]) {
  return numbers.reduce<Record<string, number>>((acc, entry) => {
    const [prefix, sequence] = entry.split("/");
    const parsed = Number(sequence);
    if (prefix && Number.isFinite(parsed)) {
      acc[prefix] = Math.max(acc[prefix] ?? 0, parsed);
    }
    return acc;
  }, {});
}

function getSequenceFromAccountNumber(value: string, prefix: string) {
  const [accountPrefix, sequence] = value.split("/");
  if (accountPrefix !== prefix) {
    return null;
  }

  const parsed = Number(sequence);
  return Number.isFinite(parsed) ? parsed : null;
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

export function LoanCreationForm({ selectedCompany }: LoanCreationFormProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [existingLoans, setExistingLoans] = useState<LoanRecord[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCustomerCode, setSearchCustomerCode] = useState("");
  const [loanDate, setLoanDate] = useState(formatIsoDate(new Date()));
  const [loanType, setLoanType] = useState<"cash_loan" | "jewel_loan">("cash_loan");
  const [loanAmount, setLoanAmount] = useState("50000");
  const [scheme, setScheme] = useState("");
  const [interestPercent, setInterestPercent] = useState("1.00");
  const [sequenceMap, setSequenceMap] = useState<Record<string, number>>({});
  const [availableSchemes, setAvailableSchemes] = useState<LoanScheme[]>([]);
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountError, setAccountError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading customer and loan data from Supabase...");
  const [accountWasEdited, setAccountWasEdited] = useState(false);
  const [jewelRows, setJewelRows] = useState<JewelRow[]>([buildJewelRow(1)]);
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
  const [sourceAccount, setSourceAccount] = useState<(typeof sourceAccounts)[number]>("Cash in Hand");
  const [isSaving, setIsSaving] = useState(false);

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
        setAvailableSchemes(nextSchemes.filter((item) => item.company === selectedCompany));
        setSequenceMap(buildHighestSequenceMap(nextLoans.map((loan) => loan.accountNumber)));
        setSearchName(nextCustomers[0]?.fullName ?? "");
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
      const matchesCompany = customer.company === selectedCompany;
      const matchesName = searchName
        ? customer.fullName.toLowerCase().includes(searchName.toLowerCase())
        : true;
      const matchesPhone = searchPhone
        ? customer.phoneNumber.replace(/\s+/g, "").includes(searchPhone.replace(/\s+/g, ""))
        : true;
      const matchesCode = searchCustomerCode
        ? customer.customerCode.includes(searchCustomerCode)
        : true;

      return matchesCompany && matchesName && matchesPhone && matchesCode;
    }) ?? null;
  }, [customers, searchCustomerCode, searchName, searchPhone, selectedCompany]);

  const financialYearPrefix = getFinancialYearPrefix(loanDate);
  const generatedAccountNumber = `${financialYearPrefix}/${(sequenceMap[financialYearPrefix] ?? 0) + 1}`;
  const currentAccountNumber = accountWasEdited ? accountNumberInput : generatedAccountNumber;
  const existingLoanNumbers = useMemo(
    () => existingLoans.map((loan) => loan.accountNumber),
    [existingLoans],
  );

  const nextAutoSequence = useMemo(() => {
    const currentSequence = getSequenceFromAccountNumber(currentAccountNumber, financialYearPrefix) ?? 0;
    const highestExisting = sequenceMap[financialYearPrefix] ?? 0;
    return Math.max(currentSequence, highestExisting) + 1;
  }, [currentAccountNumber, financialYearPrefix, sequenceMap]);

  const daysInSelectedMonth = useMemo(() => getDaysInMonth(loanDate), [loanDate]);

  const monthlyInterest = useMemo(() => {
    const loanDateValue = parseAppDate(loanDate);
    if (Number.isNaN(loanDateValue.getTime())) {
      return 0;
    }

    const monthStart = formatIsoDate(new Date(loanDateValue.getFullYear(), loanDateValue.getMonth(), 1));
    const monthEnd = formatIsoDate(new Date(loanDateValue.getFullYear(), loanDateValue.getMonth() + 1, 0));
    const rangeInterest = calculateSimpleInterestForRange(
      Number(loanAmount) || 0,
      Number(interestPercent) || 0,
      monthStart,
      monthEnd,
    );
    return rangeInterest.amount;
  }, [interestPercent, loanAmount, loanDate]);

  const yearlyInterest = useMemo(() => monthlyInterest * 12, [monthlyInterest]);

  function handleAccountNumberChange(value: string) {
    const rawSequence = value.includes("/") ? value.split("/").slice(1).join("/") : value;
    const digitsOnly = rawSequence.replace(/[^0-9]/g, "");
    const normalized = digitsOnly ? `${financialYearPrefix}/${digitsOnly}` : `${financialYearPrefix}/`;

    setAccountWasEdited(true);
    setAccountNumberInput(normalized);

    if (existingLoanNumbers.includes(normalized)) {
      setAccountError("This account number already exists.");
    } else {
      setAccountError("");
    }
  }

  function handleLoanDateChange(value: string) {
    setLoanDate(value);
    setAccountWasEdited(false);
    setAccountNumberInput("");
    setAccountError("");
  }

  function handleSchemeChange(value: string) {
    setScheme(value);
    const selectedScheme = availableSchemes.find((item) => item.id === value);
    const firstSlabRate = selectedScheme?.slabs[0]?.interestPercent;
    if (firstSlabRate) {
      setInterestPercent(firstSlabRate);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer) {
      setStatusMessage("Select a saved customer before creating a loan.");
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

    const payload: CreateLoanPayload = {
      companyName: selectedCompany,
      customerId: selectedCustomer.id,
      accountNumber: currentAccountNumber,
      loanDate,
      loanType,
      loanAmount: Number(loanAmount) || 0,
      schemeName: availableSchemes.find((item) => item.id === scheme)?.name || undefined,
      interestPercent: Number(interestPercent) || 0,
      sourceAccount,
      supportingDocuments,
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

    try {
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
        const editedSequence = getSequenceFromAccountNumber(savedLoan.accountNumber, financialYearPrefix);
        if (editedSequence) {
          setSequenceMap((current) => ({
            ...current,
            [financialYearPrefix]: Math.max(current[financialYearPrefix] ?? 0, editedSequence),
          }));
        }
      }

      setLoanType("cash_loan");
      setLoanAmount("50000");
      setScheme("");
      setInterestPercent("1.00");
      setAccountWasEdited(false);
      setAccountNumberInput("");
      setAccountError("");
      setJewelRows([buildJewelRow(1)]);
      setSupportingDocuments([]);
      setSourceAccount("Cash in Hand");
      setStatusMessage(result.message ?? "Loan saved successfully.");
    } catch {
      setStatusMessage("Unable to reach the loan save endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  function addJewelRow() {
    setJewelRows((current) =>
      current.length >= 5 ? current : [...current, buildJewelRow(current.length + 1)],
    );
  }

  function removeJewelRow(id: number) {
    setJewelRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  }

  function updateJewelRow(id: number, field: keyof JewelRow, value: string) {
    setJewelRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  return (
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
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[24px] bg-[var(--color-panel-strong)] text-2xl font-semibold text-[var(--color-accent-strong)]">
              {selectedCustomer ? getInitials(selectedCustomer.fullName) : <UserRound className="h-10 w-10" />}
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">Customer Photo</p>
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
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Saved Customer ID</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.customerCode ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Current Address</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.currentAddress ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2 xl:col-span-1"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Permanent Address</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer?.permanentAddress ?? "-"}</p></div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2 xl:col-span-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Aadhaar / Area</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer ? `${selectedCustomer.aadhaarNumber ?? "-"}  |  ${selectedCustomer.area}` : "-"}</p></div>
          </div>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Loan Details</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Acc no.</span>
            <input value={currentAccountNumber} onChange={(event) => handleAccountNumberChange(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" />
            <p className="text-xs text-[var(--color-muted)]">Financial year prefix is fixed automatically from the selected date.</p>
            {accountError ? <p className="text-sm text-red-600">{accountError}</p> : <p className="text-xs text-[var(--color-muted)]">Next auto number: {financialYearPrefix}/{nextAutoSequence}</p>}
          </label>

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
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest %</span><input value={interestPercent} onChange={(event) => setInterestPercent(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Disbursal source</span><select value={sourceAccount} onChange={(event) => setSourceAccount(event.target.value as (typeof sourceAccounts)[number])} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">{sourceAccounts.map((item) => (<option key={item} value={item}>{item}</option>))}</select></label>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Interest per month</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">Rs {monthlyInterest.toFixed(2)}</p><p className="mt-1 text-xs text-[var(--color-muted)]">Simple interest for {daysInSelectedMonth} days in selected month</p></div>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Interest per year</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">Rs {yearlyInterest.toFixed(2)}</p></div>
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
        <input type="file" multiple onChange={(event) => setSupportingDocuments(Array.from(event.target.files ?? []).map((file) => file.name))} className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]" />
        {supportingDocuments.length ? <p className="mt-3 text-sm text-[var(--color-muted)]">{supportingDocuments.join(", ")}</p> : null}
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 text-sm text-[var(--color-muted)]"><AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" /><p className="max-w-3xl leading-7">{statusMessage}</p></div>
          <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Loan  F4"}</button>
        </div>
      </section>
    </form>
  );
}







