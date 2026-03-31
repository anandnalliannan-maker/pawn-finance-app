"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

type LoginFormProps = {
  defaultRedirect: string;
};

export function LoginForm({ defaultRedirect }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("Use your operator username and password.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("Verifying credentials...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.error ?? "Unable to login.");
        return;
      }

      if (Array.isArray(result.companies) && result.companies.length === 1) {
        router.push(`/dashboard?company=${encodeURIComponent(result.companies[0].name)}`);
        return;
      }

      router.push(defaultRedirect);
    } catch {
      setStatusMessage("Unable to reach the login service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.45)] shadow-[0_40px_90px_rgba(54,39,19,0.15)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#1f2937_0%,#243447_45%,#3f2d1a_100%)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,215,162,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_25%)]" />
          <div className="relative flex h-full items-end p-12">
            <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 text-white backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-200/80">Vishnu Bankers</p>
              <h1 className="mt-4 text-4xl font-semibold">Operator Login</h1>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[rgba(252,250,247,0.8)] p-6 sm:p-10">
          <div className="app-panel w-full max-w-xl rounded-[28px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Login</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">Username and password</h2>
              </div>
              <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-muted)]">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--color-muted)]">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>

              <p className="text-sm text-[var(--color-muted)]">{statusMessage}</p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-base font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Logging in..." : "Login"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
