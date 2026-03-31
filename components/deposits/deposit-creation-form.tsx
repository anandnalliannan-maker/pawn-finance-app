"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Paperclip, Save, Sparkles } from "lucide-react";

import { formatIsoDate, toDisplayDateFromIso } from "@/lib/date-utils";
import { previewDeposits } from "@/lib/deposits";

type DepositCreationFormProps = {
  selectedCompany: string;
};

function buildHighestSequence(codes: string[]) {
  return codes.reduce((highest, code) => {
    const parsed = Number(code);
    return Number.isFinite(parsed) ? Math.max(highest, parsed) : highest;
  }, 200100);
}

export function DepositCreationForm({ selectedCompany }: DepositCreationFormProps) {
  const [depositorName, setDepositorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [depositAmount, setDepositAmount] = useState("100000");
  const [interestPercent, setInterestPercent] = useState("1.00");
  const [depositDate, setDepositDate] = useState(formatIsoDate(new Date()));
  const [statusMessage, setStatusMessage] = useState(
    "Deposit form is ready. Backend save to Supabase will be the next step.",
  );

  const nextDepositorCode = useMemo(() => {
    const currentHighest = buildHighestSequence(previewDeposits.map((deposit) => deposit.depositorCode));
    return `${currentHighest + 1}`;
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(`Deposit draft captured for ${depositorName || "new depositor"} under ${selectedCompany}.`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Deposit Registration</p><h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Create deposit</h1></div><div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]"><Sparkles className="h-6 w-6" /></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Depositor ID</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{nextDepositorCode}</p></div>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Date</span><input type="date" value={depositDate} onChange={(event) => setDepositDate(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2 xl:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Company</span><input value={selectedCompany} readOnly className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]" /></label>
          <label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Depositer Name</span><input value={depositorName} onChange={(event) => setDepositorName(event.target.value)} placeholder="Enter depositer name" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Phone Number</span><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Reference</span><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference name" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2 xl:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Address</span><textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={4} placeholder="Enter address" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Deposit Amount</span><input value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest %</span><input value={interestPercent} onChange={(event) => setInterestPercent(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Selected deposit date</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{toDisplayDateFromIso(depositDate)}</p></div>
        </div>
      </section>

      <section className="app-panel rounded-[30px] p-6 sm:p-8"><div className="flex items-center gap-3 text-[var(--color-ink)]"><Paperclip className="h-4 w-4 text-[var(--color-accent)]" /><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Supporting Documents</p></div><input type="file" className="mt-4 block w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]" /></section>
      <section className="app-panel rounded-[30px] p-6 sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3 text-sm text-[var(--color-muted)]"><AlertCircle className="mt-1 h-4 w-4 text-[var(--color-accent)]" /><p className="max-w-3xl leading-7">{statusMessage}</p></div><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"><Save className="h-4 w-4" />Save Deposit F7</button></div></section>
    </form>
  );
}
