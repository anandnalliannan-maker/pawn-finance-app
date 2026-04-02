"use client";

import { useState } from "react";
import { CalendarClock, CircleDollarSign, FileText, Landmark, Save, X } from "lucide-react";

import { formatIsoDate, toIsoDateFromDisplay } from "@/lib/date-utils";
import type { DepositRecord } from "@/lib/deposits";
import { getOutstandingDepositAmount } from "@/lib/deposits";
import { sourceAccounts } from "@/lib/source-accounts";

type DepositDetailViewProps = { deposit: DepositRecord };
type PayoutDraft = {
  paymentDate: string;
  paymentFrom: string;
  paymentUpto: string;
  principalPayment: string;
  interestPayment: string;
  sourceAccount: (typeof sourceAccounts)[number];
  notes: string;
};
function formatCurrency(value: number) { return `Rs ${value.toFixed(2)}`; }
function toAmount(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function buildInitialDraft(deposit: DepositRecord): PayoutDraft { const lastPayment = deposit.payments[deposit.payments.length - 1]; return { paymentDate: formatIsoDate(new Date()), paymentFrom: toIsoDateFromDisplay(lastPayment?.paymentUpto ?? deposit.depositDate), paymentUpto: formatIsoDate(new Date()), principalPayment: "", interestPayment: "", sourceAccount: "Cash in Hand", notes: "" }; }

export function DepositDetailView({ deposit }: DepositDetailViewProps) {
  const [depositState, setDepositState] = useState(deposit);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutDraft, setPayoutDraft] = useState<PayoutDraft>(() => buildInitialDraft(deposit));
  const [statusMessage, setStatusMessage] = useState("Deposit detail view is connected to Supabase for payout entry.");
  const [isSaving, setIsSaving] = useState(false);
  const outstandingDeposit = getOutstandingDepositAmount(depositState);
  const totalPrincipalPaid = depositState.payments.reduce((total, payment) => total + payment.principalPayment, 0);
  const totalInterestPaid = depositState.payments.reduce((total, payment) => total + payment.interestPayment, 0);
  function openPayoutModal() { setPayoutDraft(buildInitialDraft(depositState)); setShowPayoutModal(true); }
  function closePayoutModal() { setShowPayoutModal(false); }
  function handleDraftChange(field: keyof PayoutDraft, value: string) { setPayoutDraft((current) => ({ ...current, [field]: value })); }
  async function handlePayoutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/deposits/${depositState.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentDate: payoutDraft.paymentDate,
          paymentFrom: payoutDraft.paymentFrom,
          paymentUpto: payoutDraft.paymentUpto,
          principalPayment: Math.min(toAmount(payoutDraft.principalPayment), outstandingDeposit),
          interestPayment: toAmount(payoutDraft.interestPayment),
          sourceAccount: payoutDraft.sourceAccount,
          notes: payoutDraft.notes,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save payout.");
        return;
      }
      if (result.deposit) setDepositState(result.deposit as DepositRecord);
      setStatusMessage(result.message ?? `Payout recorded for ${depositState.depositorName}.`);
      setShowPayoutModal(false);
    } catch {
      setStatusMessage("Unable to reach the payout endpoint.");
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <>
      <div className="space-y-6"><section className="app-panel rounded-[30px] p-6 sm:p-8"><div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Deposit Details</p><h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">{depositState.depositorName}</h1><p className="mt-2 text-sm text-[var(--color-muted)]">Depositor ID {depositState.depositorCode} | {depositState.company}</p></div><div className="flex flex-wrap gap-3"><div className="rounded-2xl bg-[var(--color-panel-strong)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]">Original deposit: {formatCurrency(depositState.depositAmount)}</div><div className="rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white">Outstanding deposit: {formatCurrency(outstandingDeposit)}</div><button type="button" onClick={openPayoutModal} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"><CircleDollarSign className="h-4 w-4" />Record payout</button></div></div></section><section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><article className="app-panel rounded-[30px] p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Depositer Details</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><InfoCard label="Depositer name" value={depositState.depositorName} /><InfoCard label="Phone no." value={depositState.phoneNumber} /><InfoCard label="Company" value={depositState.company} /><InfoCard label="Reference" value={depositState.reference} /><InfoCard label="Address" value={depositState.address} className="sm:col-span-2" /><InfoCard label="Attachments" value={`${depositState.attachmentCount} attached`} /></div></article><article className="app-panel rounded-[30px] p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Deposit Snapshot</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><InfoCard label="Status" value={depositState.status} /><InfoCard label="Date" value={depositState.depositDate} /><InfoCard label="Interest %" value={`${depositState.interestPercent.toFixed(2)}%`} /><InfoCard label="Total principal paid" value={formatCurrency(totalPrincipalPaid)} /><InfoCard label="Total interest paid" value={formatCurrency(totalInterestPaid)} /><InfoCard label="Outstanding deposit" value={formatCurrency(outstandingDeposit)} /></div></article></section><section className="app-panel rounded-[30px] p-6 sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Payout History</p><p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p></div><button type="button" onClick={openPayoutModal} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"><Landmark className="h-4 w-4 text-[var(--color-accent)]" />Record payout</button></div><div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--color-border)] bg-white"><table className="min-w-full border-collapse"><thead><tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]"><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Interest from</th><th className="px-4 py-3 font-semibold">Interest upto</th><th className="px-4 py-3 font-semibold">Principal payout</th><th className="px-4 py-3 font-semibold">Interest payout</th><th className="px-4 py-3 font-semibold">Source account</th></tr></thead><tbody>{depositState.payments.length ? depositState.payments.map((payment) => (<tr key={payment.id} className="border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]"><td className="px-4 py-3">{payment.paymentDate}</td><td className="px-4 py-3">{payment.paymentFrom}</td><td className="px-4 py-3">{payment.paymentUpto}</td><td className="px-4 py-3">{formatCurrency(payment.principalPayment)}</td><td className="px-4 py-3">{formatCurrency(payment.interestPayment)}</td><td className="px-4 py-3">{payment.sourceAccount}</td></tr>)) : <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">No payouts recorded yet.</td></tr>}</tbody></table></div></section></div>
      {showPayoutModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,24,20,0.46)] p-4"><div className="w-full max-w-2xl rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_32px_80px_rgba(26,24,20,0.22)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Record Payout</p><h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{depositState.depositorName}</h2></div><button type="button" onClick={closePayoutModal} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]" aria-label="Close payout popup"><X className="h-4 w-4" /></button></div><form onSubmit={handlePayoutSubmit} className="mt-6 space-y-5"><div className="grid gap-4 md:grid-cols-2"><MetricCard icon={<FileText className="h-4 w-4 text-[var(--color-accent)]" />} label="Original deposit" value={formatCurrency(depositState.depositAmount)} /><MetricCard icon={<Landmark className="h-4 w-4 text-[var(--color-accent)]" />} label="Outstanding deposit" value={formatCurrency(outstandingDeposit)} /></div><div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Payment date</span><input type="date" value={payoutDraft.paymentDate} onChange={(event) => handleDraftChange("paymentDate", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Principal payout</span><input value={payoutDraft.principalPayment} onChange={(event) => handleDraftChange("principalPayment", event.target.value)} placeholder="0" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest payment from</span><input type="date" value={payoutDraft.paymentFrom} onChange={(event) => handleDraftChange("paymentFrom", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest payment upto</span><input type="date" value={payoutDraft.paymentUpto} onChange={(event) => handleDraftChange("paymentUpto", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Interest payout</span><input value={payoutDraft.interestPayment} onChange={(event) => handleDraftChange("interestPayment", event.target.value)} placeholder="0" className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label><label className="block space-y-2 md:col-span-2"><span className="text-sm font-medium text-[var(--color-muted)]">Payout source account</span><select value={payoutDraft.sourceAccount} onChange={(event) => handleDraftChange("sourceAccount", event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]">{sourceAccounts.map((account) => (<option key={account} value={account}>{account}</option>))}</select></label></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]"><CalendarClock className="h-4 w-4 text-[var(--color-accent)]" />Principal payout reduces the outstanding deposit immediately.</div><button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"><Save className="h-4 w-4" />Save payout</button></div></form></div></div> : null}
    </>
  );
}
function InfoCard({ label, value, className = "" }: { label: string; value: string; className?: string }) { return <div className={`rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 ${className}`}><p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{value}</p></div>; }
function MetricCard({ icon, label, value }: { icon: import("react").ReactNode; label: string; value: string }) { return <div className="rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{icon}<span>{label}</span></div><p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{value}</p></div>; }
