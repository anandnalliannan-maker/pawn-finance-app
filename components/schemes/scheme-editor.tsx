"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { loanSchemes, type LoanScheme, type SchemeSlab } from "@/lib/schemes";

const MAX_SCHEMES = 6;
const MAX_ROWS = 10;

function buildEmptySlab(id: number): SchemeSlab {
  return {
    id,
    startDay: "",
    endDay: "",
    interestPercent: "",
  };
}

function buildNewScheme(index: number): LoanScheme {
  return {
    id: `scheme_${index + 1}`,
    name: `Scheme ${index + 1}`,
    slabs: [buildEmptySlab(1)],
  };
}

export function SchemeEditor() {
  const [schemes, setSchemes] = useState<LoanScheme[]>(loanSchemes);
  const [activeSchemeId, setActiveSchemeId] = useState(loanSchemes[0]?.id ?? "");

  const activeScheme = useMemo(
    () => schemes.find((scheme) => scheme.id === activeSchemeId) ?? schemes[0],
    [activeSchemeId, schemes],
  );

  function updateScheme(updater: (scheme: LoanScheme) => LoanScheme) {
    setSchemes((current) =>
      current.map((scheme) =>
        scheme.id === activeScheme.id ? updater(scheme) : scheme,
      ),
    );
  }

  function updateRow(
    id: number,
    field: "startDay" | "endDay" | "interestPercent",
    value: string,
  ) {
    updateScheme((scheme) => ({
      ...scheme,
      slabs: scheme.slabs.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
  }

  function addRow() {
    updateScheme((scheme) =>
      scheme.slabs.length >= MAX_ROWS
        ? scheme
        : {
            ...scheme,
            slabs: [...scheme.slabs, buildEmptySlab(scheme.slabs.length + 1)],
          },
    );
  }

  function deleteRow(id: number) {
    updateScheme((scheme) => ({
      ...scheme,
      slabs:
        scheme.slabs.length === 1
          ? scheme.slabs
          : scheme.slabs.filter((row) => row.id !== id),
    }));
  }

  function addScheme() {
    setSchemes((current) => {
      if (current.length >= MAX_SCHEMES) {
        return current;
      }

      const nextScheme = buildNewScheme(current.length);
      setActiveSchemeId(nextScheme.id);
      return [...current, nextScheme];
    });
  }

  function deleteScheme() {
    setSchemes((current) => {
      if (current.length === 1) {
        return current;
      }

      const remaining = current.filter((scheme) => scheme.id !== activeScheme.id);
      setActiveSchemeId(remaining[0]?.id ?? "");
      return remaining;
    });
  }

  if (!activeScheme) {
    return null;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.3fr_0.7fr]">
      <aside className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Schemes
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              Loan schemes
            </h1>
          </div>
          <span className="rounded-full bg-[var(--color-panel-strong)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-accent-strong)]">
            {schemes.length}/{MAX_SCHEMES}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {schemes.map((scheme, index) => {
            const isActive = scheme.id === activeScheme.id;

            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setActiveSchemeId(scheme.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-panel-strong)] text-[var(--color-ink)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-accent)]"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">{scheme.name}</span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.14em]">
                    Scheme {index + 1}
                  </span>
                </span>
                <span className="rounded-full bg-black/6 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">
                  {scheme.slabs.length} rows
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addScheme}
          disabled={schemes.length >= MAX_SCHEMES}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add scheme (max 6)
        </button>
      </aside>

      <section className="app-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Editing: {activeScheme.name.toLowerCase()}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Scheme details</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={deleteScheme}
              className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
            >
              Delete scheme
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white"
            >
              <Save className="h-4 w-4" />
              Save scheme
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">Scheme Name</span>
            <input
              value={activeScheme.name}
              onChange={(event) =>
                updateScheme((scheme) => ({ ...scheme, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>

          <p className="text-sm leading-7 text-[var(--color-muted)]">
            Create up to 6 schemes. Each scheme can have up to 10 rows. If end day is left blank, it will be treated as open ended.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white">
              <thead>
                <tr className="bg-[var(--color-panel-strong)] text-left text-sm text-[var(--color-ink)]">
                  <th className="px-4 py-3 font-semibold">Start day</th>
                  <th className="px-4 py-3 font-semibold">End day</th>
                  <th className="px-4 py-3 font-semibold">Interest %</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeScheme.slabs.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <input
                        value={row.startDay}
                        onChange={(event) => updateRow(row.id, "startDay", event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={row.endDay}
                        onChange={(event) => updateRow(row.id, "endDay", event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={row.interestPercent}
                        onChange={(event) => updateRow(row.id, "interestPercent", event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={activeScheme.slabs.length >= MAX_ROWS}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add row (max 10)
          </button>
        </div>
      </section>
    </section>
  );
}
