"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Paperclip, Plus, Save, Search, Sparkles, Trash2, UserRound } from "lucide-react";
import { loanSchemes } from "@/lib/schemes";

type LoanCreationFormProps = {
  selectedCompany: string;
};

type CustomerRecord = {
  id: string;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  currentAddress: string;
  permanentAddress: string;
  aadhaarNumber: string;
  area: string;
};

type JewelRow = {
  id: number;
  jewelType: string;
  jewelWeight: string;
  stoneWeight: string;
};

const customers: CustomerRecord[] = [
  {
    id: "cus_1",
    customerCode: "102344",
    fullName: "Priya S",
    phoneNumber: "+91 98400 12345",
    currentAddress: "12, Market Road, Gandhipuram",
    permanentAddress: "12, Market Road, Gandhipuram",
    aadhaarNumber: "4587 9987 1120",
    area: "Gandhipuram",
  },
  {
    id: "cus_2",
    customerCode: "102198",
    fullName: "Ramesh K",
    phoneNumber: "+91 98940 55123",
    currentAddress: "4, New Street, Pollachi",
    permanentAddress: "4, New Street, Pollachi",
    aadhaarNumber: "8876 5523 1098",
    area: "Pollachi",
  },
  {
    id: "cus_3",
    customerCode: "102145",
    fullName: "Meena V",
    phoneNumber: "+91 97890 44002",
    currentAddress: "22, Mill Road, Tiruppur",
    permanentAddress: "22, Mill Road, Tiruppur",
    aadhaarNumber: "7744 6622 1144",
    area: "Tiruppur",
  },
];

const schemes = [
  { value: "", label: "Select later", interestPercent: "" },
  ...loanSchemes.map((scheme) => ({
    value: scheme.id,
    label: scheme.name,
    interestPercent: scheme.slabs[0]?.interestPercent ?? "",
  })),
];

const existingLoanNumbers = [
  "2025-2026/104",
  "2025-2026/105",
  "2025-2026/109",
  "2024-2025/243",
];

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
}

function parseDisplayDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const [day, month, year] = value.split("-");
  if (!day || !month || !year) {
    return new Date();
  }

  return new Date(`${day} ${month} ${year}`);
}

function getFinancialYearPrefix(value: string) {
  const date = parseDisplayDate(value);
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
  const [searchName, setSearchName] = useState(customers[0]?.fullName ?? "");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCustomerCode, setSearchCustomerCode] = useState("");
  const [loanDate, setLoanDate] = useState(formatDisplayDate(new Date()));
  const [loanType, setLoanType] = useState<"cash_loan" | "jewel_loan">("cash_loan");
  const [loanAmount, setLoanAmount] = useState("50000");
  const [scheme, setScheme] = useState("");
  const [interestPercent, setInterestPercent] = useState("1.00");
  const [sequenceMap, setSequenceMap] = useState(() => buildHighestSequenceMap(existingLoanNumbers));
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountError, setAccountError] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Loan form is ready. Save wiring and duplicate enforcement against live Supabase data will be the next backend step.",
  );
  const [accountWasEdited, setAccountWasEdited] = useState(false);
  const [jewelRows, setJewelRows] = useState<JewelRow[]>([buildJewelRow(1)]);

  const selectedCustomer = useMemo(() => {
    return (
      customers.find((customer) => {
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
      }) ?? customers[0]
    );
  }, [searchCustomerCode, searchName, searchPhone]);


  const financialYearPrefix = getFinancialYearPrefix(loanDate);
  const generatedAccountNumber = `${financialYearPrefix}/${(sequenceMap[financialYearPrefix] ?? 0) + 1}`;
  const currentAccountNumber = accountWasEdited ? accountNumberInput : generatedAccountNumber;

  const nextAutoSequence = useMemo(() => {
    const currentSequence = getSequenceFromAccountNumber(currentAccountNumber, financialYearPrefix) ?? 0;
    const highestExisting = sequenceMap[financialYearPrefix] ?? 0;
    return Math.max(currentSequence, highestExisting) + 1;
  }, [currentAccountNumber, financialYearPrefix, sequenceMap]);

  const monthlyInterest = useMemo(() => {
    const principal = Number(loanAmount) || 0;
    const rate = Number(interestPercent) || 0;
    return (principal * rate) / 100;
  }, [interestPercent, loanAmount]);

  const yearlyInterest = monthlyInterest * 12;

  function handleAccountNumberChange(value: string) {
    setAccountWasEdited(true);
    setAccountNumberInput(value);

    if (existingLoanNumbers.includes(value)) {
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
    const selectedScheme = schemes.find((item) => item.value === value);
    if (selectedScheme?.interestPercent) {
      setInterestPercent(selectedScheme.interestPercent);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (existingLoanNumbers.includes(currentAccountNumber)) {
      const message = "Duplicate account number found. Please use a different account number.";
      setAccountError(message);
      setStatusMessage(message);
      window.alert(message);
      return;
    }

    const editedSequence = getSequenceFromAccountNumber(currentAccountNumber, financialYearPrefix);
    if (editedSequence) {
      setSequenceMap((current) => ({
        ...current,
        [financialYearPrefix]: Math.max(current[financialYearPrefix] ?? 0, editedSequence),
      }));
    }

    setStatusMessage(
      `Loan draft captured for ${selectedCustomer.fullName}. Next auto loan number will continue from ${financialYearPrefix}/${nextAutoSequence}.`,
    );
    setAccountWasEdited(false);
    setAccountNumberInput("");
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Customer Details
            </p>
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
                <input
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder="Type customer name"
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-muted)]">Phone Number</span>
              <input
                value={searchPhone}
                onChange={(event) => setSearchPhone(event.target.value)}
                placeholder="Type phone number"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-muted)]">Customer ID</span>
              <input
                value={searchCustomerCode}
                onChange={(event) => setSearchCustomerCode(event.target.value)}
                placeholder="Type customer ID"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>

            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Matched Customer</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer.fullName}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Saved Phone</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer.phoneNumber}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Saved Customer ID</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer.customerCode}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Current Address</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer.currentAddress}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2 xl:col-span-1">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Permanent Address</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{selectedCustomer.permanentAddress}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 md:col-span-2 xl:col-span-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Aadhaar / Area</p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">
                {selectedCustomer.aadhaarNumber}  |  {selectedCustomer.area}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Loan Details
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Acc no.</span>
            <input
              value={currentAccountNumber}
              onChange={(event) => handleAccountNumberChange(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            />
            {accountError ? (
              <p className="text-sm text-red-600">{accountError}</p>
            ) : (
              <p className="text-xs text-[var(--color-muted)]">
                Next auto number: {financialYearPrefix}/{nextAutoSequence}
              </p>
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Date</span>
            <input
              value={loanDate}
              onChange={(event) => handleLoanDateChange(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Loan Type</span>
            <select
              value={loanType}
              onChange={(event) => setLoanType(event.target.value as "cash_loan" | "jewel_loan")}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            >
              <option value="cash_loan">Cash</option>
              <option value="jewel_loan">Jewel</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Company</span>
            <input
              value={selectedCompany}
              readOnly
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Loan Amount</span>
            <input
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Scheme</span>
            <select
              value={scheme}
              onChange={(event) => handleSchemeChange(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            >
              {schemes.map((item) => (
                <option key={item.label} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Interest %</span>
            <input
              value={interestPercent}
              onChange={(event) => setInterestPercent(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Interest per month</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">Rs {monthlyInterest.toFixed(2)}</p>
          </div>

          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Interest per year</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">Rs {yearlyInterest.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {loanType === "jewel_loan" ? (
        <section className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Jewel Details
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">Add up to 5 rows</p>
            </div>
            <button
              type="button"
              onClick={addJewelRow}
              disabled={jewelRows.length >= 5}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add row
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white">
              <thead>
                <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                  <th className="px-4 py-3 font-semibold">Jewel Type</th>
                  <th className="px-4 py-3 font-semibold">Jewel wt.</th>
                  <th className="px-4 py-3 font-semibold">Stone wt.</th>
                  <th className="px-4 py-3 font-semibold">Gold wt.</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {jewelRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <input
                        value={row.jewelType}
                        onChange={(event) => updateJewelRow(row.id, "jewelType", event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={row.jewelWeight}
                        onChange={(event) => updateJewelRow(row.id, "jewelWeight", event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={row.stoneWeight}
                        onChange={(event) => updateJewelRow(row.id, "stoneWeight", event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={getGoldWeight(row)}
                        readOnly
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-[var(--color-muted)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeJewelRow(row.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[var(--color-ink)]">
          <Paperclip className="h-4 w-4 text-[var(--color-accent)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Supporting Documents
          </p>
        </div>
        <input
          type="file"
          className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]"
        />
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
            <AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" />
            <p className="max-w-3xl leading-7">{statusMessage}</p>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            <Save className="h-4 w-4" />
            Save Loan  F4
          </button>
        </div>
      </section>
    </form>
  );
}




