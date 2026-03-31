"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import type { LoanScheme, SaveLoanSchemePayload, SchemeSlab } from "@/lib/schemes";

const MAX_SCHEMES = 6;
const MAX_ROWS = 10;
const DEFAULT_COMPANY = "Vishnu Bankers - Main Branch";

function buildEmptySlab(id: number): SchemeSlab {
  return {
    id: String(id),
    startDay: "",
    endDay: "",
    interestPercent: "",
  };
}

function buildNewScheme(index: number): LoanScheme {
  return {
    id: `new_${index + 1}`,
    name: `Scheme ${index + 1}`,
    company: DEFAULT_COMPANY,
    slabs: [buildEmptySlab(1)],
  };
}

export function SchemeEditor() {
  const [schemes, setSchemes] = useState<LoanScheme[]>([]);
  const [activeSchemeId, setActiveSchemeId] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading schemes from Supabase...");
  const activeScheme = useMemo(() => schemes.find((scheme) => scheme.id === activeSchemeId) ?? schemes[0], [activeSchemeId, schemes]);

  useEffect(() => {
    let isMounted = true;
    async function loadSchemes() {
      try {
        const response = await fetch("/api/schemes", { cache: "no-store" });
        const result = await response.json();
        if (!isMounted) return;
        if (!response.ok) {
          setStatusMessage(result.error ?? "Unable to load schemes.");
          return;
        }
        const nextSchemes = (result.schemes ?? []) as LoanScheme[];
        setSchemes(nextSchemes);
        setActiveSchemeId(nextSchemes[0]?.id ?? "");
        setStatusMessage("Schemes are reading from Supabase.");
      } catch {
        if (isMounted) setStatusMessage("Unable to reach the schemes API.");
      }
    }
    loadSchemes();
    return () => { isMounted = false; };
  }, []);

  function updateScheme(updater: (scheme: LoanScheme) => LoanScheme) {
    if (!activeScheme) return;
    setSchemes((current) => current.map((scheme) => scheme.id === activeScheme.id ? updater(scheme) : scheme));
  }

  function updateRow(id: string, field: "startDay" | "endDay" | "interestPercent", value: string) {
    updateScheme((scheme) => ({ ...scheme, slabs: scheme.slabs.map((row) => row.id === id ? { ...row, [field]: value } : row) }));
  }

  function addRow() {
    updateScheme((scheme) => scheme.slabs.length >= MAX_ROWS ? scheme : { ...scheme, slabs: [...scheme.slabs, buildEmptySlab(scheme.slabs.length + 1)] });
  }

  function deleteRow(id: string) {
    updateScheme((scheme) => ({ ...scheme, slabs: scheme.slabs.length === 1 ? scheme.slabs : scheme.slabs.filter((row) => row.id !== id) }));
  }

  function addScheme() {
    setSchemes((current) => {
      if (current.length >= MAX_SCHEMES) return current;
      const nextScheme = buildNewScheme(current.length);
      setActiveSchemeId(nextScheme.id);
      return [...current, nextScheme];
    });
  }

  async function deleteScheme() {
    if (!activeScheme) return;
    if (activeScheme.id.startsWith("new_")) {
      setSchemes((current) => current.filter((scheme) => scheme.id !== activeScheme.id));
      setActiveSchemeId(schemes[0]?.id ?? "");
      return;
    }

    try {
      const response = await fetch(`/api/schemes/${activeScheme.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to delete scheme.");
        return;
      }
      const nextSchemes = (result.schemes ?? []) as LoanScheme[];
      setSchemes(nextSchemes);
      setActiveSchemeId(nextSchemes[0]?.id ?? "");
      setStatusMessage(result.message ?? "Scheme deleted successfully.");
    } catch {
      setStatusMessage("Unable to reach the scheme delete endpoint.");
    }
  }

  async function saveScheme() {
    if (!activeScheme) return;
    const payload: SaveLoanSchemePayload = {
      id: activeScheme.id.startsWith("new_") ? undefined : activeScheme.id,
      code: activeScheme.code,
      companyName: activeScheme.company || DEFAULT_COMPANY,
      name: activeScheme.name,
      slabs: activeScheme.slabs.map((slab) => ({
        startDay: Number(slab.startDay) || 0,
        endDay: slab.endDay ? Number(slab.endDay) || null : null,
        interestPercent: Number(slab.interestPercent) || 0,
      })),
    };

    try {
      const response = await fetch("/api/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to save scheme.");
        return;
      }
      const nextSchemes = (result.schemes ?? []) as LoanScheme[];
      setSchemes(nextSchemes);
      const matched = nextSchemes.find((scheme) => scheme.name === activeScheme.name) ?? nextSchemes[0];
      setActiveSchemeId(matched?.id ?? "");
      setStatusMessage(result.message ?? "Scheme saved successfully.");
    } catch {
      setStatusMessage("Unable to reach the scheme save endpoint.");
    }
  }

  if (!activeScheme) {
    return <section className="app-panel rounded-[30px] p-6 sm:p-8"><p className="text-sm text-[var(--color-muted)]">{statusMessage}</p></section>;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.3fr_0.7fr]">
      <aside className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Schemes</p><h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Loan schemes</h1><p className="mt-2 text-sm text-[var(--color-muted)]">{statusMessage}</p></div><span className="rounded-full bg-[var(--color-panel-strong)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-accent-strong)]">{schemes.length}/{MAX_SCHEMES}</span></div>
        <div className="mt-6 space-y-3">{schemes.map((scheme, index) => <button key={scheme.id} type="button" onClick={() => setActiveSchemeId(scheme.id)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${scheme.id === activeScheme.id ? "border-[var(--color-accent)] bg-[var(--color-panel-strong)] text-[var(--color-ink)]" : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-accent)]"}`}><span><span className="block text-sm font-semibold">{scheme.name}</span><span className="mt-1 block text-xs uppercase tracking-[0.14em]">Scheme {index + 1}</span></span><span className="rounded-full bg-black/6 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">{scheme.slabs.length} rows</span></button>)}</div>
        <button type="button" onClick={addScheme} disabled={schemes.length >= MAX_SCHEMES} className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add scheme (max 6)</button>
      </aside>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Editing: {activeScheme.name.toLowerCase()}</p><h2 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Scheme details</h2></div><div className="flex items-center gap-3"><button type="button" onClick={deleteScheme} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)]">Delete scheme</button><button type="button" onClick={saveScheme} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white"><Save className="h-4 w-4" />Save scheme</button></div></div>
        <div className="mt-8 space-y-6">
          <label className="block space-y-2"><span className="text-sm font-medium text-[var(--color-muted)]">Scheme Name</span><input value={activeScheme.name} onChange={(event) => updateScheme((scheme) => ({ ...scheme, name: event.target.value }))} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]" /></label>
          <p className="text-sm leading-7 text-[var(--color-muted)]">Create up to 6 schemes. Each scheme can have up to 10 rows. If end day is left blank, it will be treated as open ended.</p>
          <div className="overflow-x-auto"><table className="min-w-full border-collapse overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white"><thead><tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]"><th className="px-4 py-3 font-semibold">Start day</th><th className="px-4 py-3 font-semibold">End day</th><th className="px-4 py-3 font-semibold">Interest %</th><th className="px-4 py-3 font-semibold">Action</th></tr></thead><tbody>{activeScheme.slabs.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="px-4 py-3"><input value={row.startDay} onChange={(event) => updateRow(row.id, "startDay", event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none" /></td><td className="px-4 py-3"><input value={row.endDay} onChange={(event) => updateRow(row.id, "endDay", event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none" /></td><td className="px-4 py-3"><input value={row.interestPercent} onChange={(event) => updateRow(row.id, "interestPercent", event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none" /></td><td className="px-4 py-3"><button type="button" onClick={() => deleteRow(row.id)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)]"><Trash2 className="h-4 w-4" />Delete</button></td></tr>)}</tbody></table></div>
          <button type="button" onClick={addRow} disabled={activeScheme.slabs.length >= MAX_ROWS} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add row (max 10)</button>
        </div>
      </section>
    </section>
  );
}
