import Link from "next/link";
import { ArrowRight, Building2, KeyRound, ShieldCheck } from "lucide-react";

import { AuthFeatureCard } from "@/components/auth/auth-feature-card";

const featureCards = [
  {
    title: "Role-first access",
    description:
      "Separate admin and staff workflows with company-aware permissions from the start.",
    icon: ShieldCheck,
  },
  {
    title: "Multi-company workflow",
    description:
      "Switch between branches and legal entities without rebuilding the navigation model later.",
    icon: Building2,
  },
  {
    title: "Fast operator entry",
    description:
      "Design the interface around quick search, compact forms, and keyboard-friendly actions.",
    icon: KeyRound,
  },
];

export default function LoginPage() {
  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.45)] shadow-[0_40px_90px_rgba(54,39,19,0.15)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#1f2937_0%,#243447_45%,#3f2d1a_100%)] p-8 text-white sm:p-10 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,215,162,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_25%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm tracking-[0.18em] text-white/80 uppercase">
              Pawn Finance Suite
            </div>
            <div className="mt-8 max-w-xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-200/80">
                Staff-first operations
              </p>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                Secure branch operations for loans, customers, and daily cash flow.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-200">
                This foundation is built for finance desks that need precision,
                speed, and auditability without turning the workflow into a slow
                enterprise form dump.
              </p>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4">
            {featureCards.map((card) => (
              <AuthFeatureCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-[rgba(252,250,247,0.8)] p-6 sm:p-10">
          <div className="app-panel w-full max-w-xl rounded-[28px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Login
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
                  Access your workspace
                </h2>
              </div>
              <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <form className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-muted)]">
                  Username
                </span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-muted)]">
                  Password
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>

              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm leading-7 text-[var(--color-muted)]">
                Authentication will be connected to Supabase Auth next. For now,
                this screen establishes the workflow and visual system.
              </div>

              <Link
                href="/select-company"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-base font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                Continue to company selection
                <ArrowRight className="h-4 w-4" />
              </Link>
            </form>

            <div className="mt-8 grid gap-3 rounded-3xl bg-[var(--color-panel-strong)] p-5 text-sm text-[var(--color-muted)] sm:grid-cols-3">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">Desktop</p>
                <p className="mt-1">Primary workflow for staff counters and admin desks.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">Mobile</p>
                <p className="mt-1">Responsive access for quick lookup and approval work.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">Shortcuts</p>
                <p className="mt-1">Keyboard flows will be layered into data-entry screens.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
