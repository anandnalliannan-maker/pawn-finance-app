"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Paperclip, ReceiptText, Save } from "lucide-react";

import { formatIsoDate, isDateWithinRange } from "@/lib/date-utils";
import { voucherCategories, voucherEntries, type VoucherEntry } from "@/lib/ledger";

function formatCurrency(value: number) { return `Rs ${value.toFixed(2)}`; }

export function VoucherBook({ selectedCompany }: { selectedCompany: string }) {
  const [entries, setEntries] = useState<VoucherEntry[]>(voucherEntries.filter((entry) => entry.company === selectedCompany));
  const [voucherDate, setVoucherDate] = useState(formatIsoDate(new Date()));
  const [category, setCategory] = useState<VoucherEntry["category"]>("Tea");
  const [payee, setPayee] = useState("");
  const [remarks, setRemarks] = useState("");
  const [amount, setAmount] = useState("0");
  const [selectedFilter, setSelectedFilter] = useState<VoucherEntry["category"] | "All">("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusMessage, setStatusMessage] = useState("Voucher section is ready. Expense categories recorded here will feed the ledger once backend save is wired.");

  const filteredEntries = useMemo(() => entries.filter((entry) => (selectedFilter === "All" ? true : entry.category === selectedFilter) && isDateWithinRange(entry.date, fromDate, toDate)), [entries, selectedFilter, fromDate, toDate]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEntry: VoucherEntry = { id: `voucher-${Date.now()}`, date: voucherDate, company: selectedCompany, category, payee: payee || "Expense entry", remarks, amount: Number(amount) || 0 };
    setEntries((current) => [nextEntry, ...current]);
    setStatusMessage(`${category} voucher recorded for ${selectedCompany}. Ledger linkage will be persisted in the backend layer.`);
    setPayee(""); setRemarks(""); setAmount("0");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Vouchers</p><h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Record operating expenses</h1></div><div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]"><ReceiptText className="h-6 w-6" /></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Date</span><input type="date" value={voucherDate} onChange={(event) => setVoucherDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2 xl:col-span-3"><span className="text-sm font-medium text-[var(--color-muted)]">Company</span><input value={selectedCompany} readOnly className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Category</span><select value={category} onChange={(event) => setCategory(event.target.value as VoucherEntry["category"])} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">{voucherCategories.map((item) => (<option key={item} value={item}>{item}</option>))}</select></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Payee</span><input value={payee} onChange={(event) => setPayee(event.target.value)} placeholder="Vendor or employee name" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Amount</span><input value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2 xl:col-span-4"><span className="text-sm font-medium text-[var(--color-muted)]">Remarks</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} placeholder="Reason for the voucher" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
        </div>
        <section className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-white p-5"><div className="flex items-center gap-3 text-[var(--color-ink)]"><Paperclip className="h-4 w-4 text-[var(--color-accent)]" /><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Supporting Documents</p></div><input type="file" className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]" /></section>
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3 text-sm text-[var(--color-muted)]"><AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" /><p className="max-w-3xl leading-7">{statusMessage}</p></div><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"><Save className="h-4 w-4" />Save Voucher</button></div>
      </form>
      <section className="app-panel rounded-[30px] p-6 sm:p-8"><div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label></div><div className="mt-4 flex flex-wrap gap-2">{(["All", ...voucherCategories] as const).map((item) => (<button key={item} type="button" onClick={() => setSelectedFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${selectedFilter === item ? "bg-[var(--color-sidebar)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]"}`}>{item}</button>))}</div><div className="mt-6 grid gap-3">{filteredEntries.map((entry) => (<article key={entry.id} className="rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4"><div className="grid gap-3 lg:grid-cols-[0.12fr_0.18fr_0.18fr_0.16fr_0.36fr] lg:items-center"><Cell label="Date" value={entry.date} /><Cell label="Category" value={entry.category} /><Cell label="Payee" value={entry.payee} /><Cell label="Amount" value={formatCurrency(entry.amount)} /><Cell label="Remarks" value={entry.remarks || "-"} /></div></article>))}</div></section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)] lg:hidden">{label}</p><p className="text-sm text-[var(--color-muted)]">{value}</p></div>; }
