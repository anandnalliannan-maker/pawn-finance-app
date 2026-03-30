import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.45)] shadow-[0_40px_90px_rgba(54,39,19,0.15)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#1f2937_0%,#243447_45%,#3f2d1a_100%)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,215,162,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_25%)]" />
          <div className="relative flex h-full items-end p-12">
            <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 text-white backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-200/80">
                Vishnu Bankers
              </p>
              <h1 className="mt-4 text-4xl font-semibold">Operator Login</h1>
            </div>
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
                  Username and password
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

              <Link
                href="/select-company"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-base font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
