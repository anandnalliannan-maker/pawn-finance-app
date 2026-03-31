"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calculator, Save, Wallet } from "lucide-react";

import type { CashBookDayRecord } from "@/lib/cash-book";
import { companyOptions, matchesCompanyFilter } from "@/lib/companies";
import { formatDisplayDate, formatIsoDate, toDisplayDateFromIso } from "@/lib/date-utils";
import type { LedgerEntry } from "@/lib/ledger";

function formatCurrency(value: number) {
  return `Rs ${value.toFixed(2)}`;
}

function toAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CashBookView() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [savedDays, setSavedDays] = useState<CashBookDayRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatIsoDate(new Date()));
  const [companyFilter, setCompanyFilter] = useState("");
  const [openingBalanceInput, setOpeningBalanceInput] = useState("0");
  const [cashCountedInput, setCashCountedInput] = useState("");
  const [remarks, setRemarks] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading cash book and ledger data from Supabase...");
  const [isSaving, setIsSaving] = useState(false);
  const displayDate = toDisplayDateFromIso(selectedDate);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [ledgerResponse, cashBookResponse] = await Promise.all([
          fetch("/api/ledger", { cache: "no-store" }),
          fetch("/api/cash-book", { cache: "no-store" }),
        ]);

        const ledgerResult = await ledgerResponse.json();
        const cashBookResult = await cashBookResponse.json();

        if (!isMounted) {
          return;
        }

        if (!ledgerResponse.ok) {
          setStatusMessage(ledgerResult.error ?? "Unable to load ledger entries.");
          return;
        }

        if (!cashBookResponse.ok) {
          setStatusMessage(cashBookResult.error ?? "Unable to load cash book records.");
          return;
        }

        setEntries((ledgerResult.entries ?? []) as LedgerEntry[]);
        setSavedDays((cashBookResult.days ?? []) as CashBookDayRecord[]);
        setStatusMessage("Cash book is reading persisted reconciliations and live ledger movement.");
      } catch {
        if (isMounted) {
          setStatusMessage("Unable to reach the cash book endpoints.");
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const savedDay = useMemo(
    () => savedDays.find((entry) => entry.bookDate === displayDate && matchesCompanyFilter(entry.company, companyFilter)),
    [companyFilter, displayDate, savedDays],
  );

  const dayEntries = useMemo(() => {
    return entries.filter((entry) => matchesCompanyFilter(entry.company, companyFilter) && entry.date === displayDate);
  }, [companyFilter, displayDate, entries]);

  useEffect(() => {
    if (savedDay) {
      setOpeningBalanceInput(String(savedDay.openingBalance));
      setCashCountedInput(String(savedDay.cashInHand));
      setRemarks(savedDay.remarks);
      return;
    }

    setOpeningBalanceInput("0");
    setCashCountedInput("");
    setRemarks("");
  }, [savedDay]);

  const totalIncoming = useMemo(() => dayEntries.filter((entry) => entry.direction === "Incoming").reduce((sum, entry) => sum + entry.amount, 0), [dayEntries]);
  const totalOutgoing = useMemo(() => dayEntries.filter((entry) => entry.direction === "Outgoing").reduce((sum, entry) => sum + entry.amount, 0), [dayEntries]);
  const currentOpeningBalance = toAmount(openingBalanceInput);
  const expectedClosingBalance = currentOpeningBalance + totalIncoming - totalOutgoing;
  const cashInHand = cashCountedInput === "" ? expectedClosingBalance : toAmount(cashCountedInput);
  const reconciliationDifference = cashInHand - expectedClosingBalance;
  const differenceLabel = reconciliationDifference === 0 ? "Balanced" : reconciliationDifference > 0 ? "Excess cash" : "Cash shortage";

  async function handleSaveDayBook() {
    if (!companyFilter) {
      setStatusMessage("Select a company filter before saving a cash book reconciliation.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/cash-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyFilter,
          bookDate: selectedDate,
          openingBalance: currentOpeningBalance,
          totalIncoming,
          totalOutgoing,
          expectedClosingBalance,
          cashInHand,
          reconciliationDifference,
          remarks,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save cash book.");
        return;
      }
      if (result.day) {
        const nextDay = result.day as CashBookDayRecord;
        setSavedDays((current) => {
          const remaining = current.filter((entry) => !(entry.companyId === nextDay.companyId && entry.bookDate === nextDay.bookDate));
          return [nextDay, ...remaining];
        });
      }
      setStatusMessage(result.message ?? `Cash book saved for ${displayDate}.`);
    } catch {
      setStatusMessage("Unable to reach the cash book save endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Day Book / Cash Book</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Daily opening, closing, and branch cash reconciliation</h1>
          </div>
          <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]"><Wallet className="h-6 w-6" /></div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Company filter</span><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"><option value="">Filter by company</option>{companyOptions.map((company) => <option key={company.code} value={company.name}>{company.name}</option>)}</select></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Daily opening balance</span><input value={openingBalanceInput} onChange={(event) => setOpeningBalanceInput(event.target.value)} inputMode="decimal" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Cash in hand</span><input value={cashCountedInput === "" ? `${expectedClosingBalance}` : cashCountedInput} onChange={(event) => setCashCountedInput(event.target.value)} inputMode="decimal" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </div>

        <div className="mt-4 rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Saved reconciliation</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{savedDay ? `${savedDay.status} on ${savedDay.bookDate}. ${savedDay.remarks || "No remarks saved."}` : "No saved cash book entry for this filtered selection yet."}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Opening balance" value={formatCurrency(currentOpeningBalance)} />
        <MetricCard label="Incoming today" value={formatCurrency(totalIncoming)} accent="incoming" />
        <MetricCard label="Outgoing today" value={formatCurrency(totalOutgoing)} accent="outgoing" />
        <MetricCard label="Closing balance" value={formatCurrency(expectedClosingBalance)} />
        <MetricCard label="Cash in hand" value={formatCurrency(cashInHand)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-center gap-3 text-[var(--color-accent)]"><Calculator className="h-5 w-5" /><p className="text-sm font-semibold uppercase tracking-[0.18em]">Branch Reconciliation</p></div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MetricCard label="Difference" value={formatCurrency(reconciliationDifference)} highlight={reconciliationDifference !== 0} />
            <div className={`rounded-[24px] border px-4 py-4 ${reconciliationDifference === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Status</p><p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{differenceLabel}</p><p className="mt-2 text-sm text-[var(--color-muted)]">{reconciliationDifference === 0 ? "Counted cash matches the expected closing balance." : "Review payments, loan disbursals, vouchers, and any manual branch movement."}</p></div>
          </div>

          <label className="mt-6 block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Reconciliation remarks</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={5} placeholder="Enter cash shortage, excess, or branch handover notes" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </article>

        <article className="app-panel rounded-[30px] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Movement Summary</p>
          <div className="mt-6 space-y-4">
            <MovementRow label="Loan disbursals and expenses" amount={totalOutgoing} description="Cash moved out through loans, vouchers, deposit payouts, and branch spends." />
            <MovementRow label="Collections and incoming funds" amount={totalIncoming} description="Cash received from loan payments and outside deposits." incoming />
            <MovementRow label="Net cash movement" amount={totalIncoming - totalOutgoing} description="Incoming minus outgoing for the selected date." highlight />
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]"><p className="font-medium text-[var(--color-ink)]">Company filter</p><p className="mt-1">{companyFilter || "Showing all companies"}</p><p className="mt-4 font-medium text-[var(--color-ink)]">Book date</p><p className="mt-1">{displayDate || formatDisplayDate(new Date())}</p></div>
          </div>
        </article>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Day Transactions</p>
        <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {dayEntries.length ? (
                dayEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]">
                    <td className="px-4 py-3">{entry.company}</td>
                    <td className="px-4 py-3">{entry.category}</td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className="px-4 py-3">{entry.direction}</td>
                    <td className="px-4 py-3">{formatCurrency(entry.amount)}</td>
                    <td className="px-4 py-3">{entry.reference}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">No ledger transactions available for this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3 text-sm text-[var(--color-muted)]"><AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" /><p className="max-w-3xl leading-7">{statusMessage}</p></div><button type="button" disabled={isSaving} onClick={handleSaveDayBook} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Cash Book"}</button></div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, highlight = false, accent }: { label: string; value: string; highlight?: boolean; accent?: "incoming" | "outgoing"; }) {
  const accentClass = accent === "incoming" ? "border-emerald-200 bg-emerald-50" : accent === "outgoing" ? "border-rose-200 bg-rose-50" : highlight ? "border-amber-200 bg-amber-50" : "border-[var(--color-border)] bg-white";

  return <div className={`rounded-[24px] border px-4 py-4 ${accentClass}`}><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p><p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{value}</p></div>;
}

function MovementRow({ label, amount, description, incoming = false, highlight = false }: { label: string; amount: number; description: string; incoming?: boolean; highlight?: boolean; }) {
  const rowClass = highlight ? "border-amber-200 bg-amber-50" : incoming ? "border-emerald-200 bg-emerald-50" : "border-[var(--color-border)] bg-white";

  return <div className={`rounded-[24px] border px-4 py-4 ${rowClass}`}><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p><p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p></div><p className="text-base font-semibold text-[var(--color-ink)]">{formatCurrency(amount)}</p></div></div>;
}
