import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  CircleDollarSign,
  FileBarChart2,
  HandCoins,
  LayoutDashboard,
  Search,
  Settings,
  UsersRound,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: UsersRound },
  { label: "Loans", href: "/loans", icon: HandCoins },
  { label: "Payments", href: "/payments", icon: CircleDollarSign },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
  { label: "Admin", href: "/admin", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.55)] shadow-[0_40px_90px_rgba(54,39,19,0.15)] lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col justify-between bg-[linear-gradient(180deg,#1f2937_0%,#243447_45%,#312217_100%)] p-6 text-white sm:p-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/12 p-3">
                <Building2 className="h-6 w-6 text-amber-200" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-white/60">
                  Branch Workspace
                </p>
                <h1 className="text-xl font-semibold">Pawn Finance</h1>
              </div>
            </div>

            <nav className="mt-10 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">
              Current company
            </p>
            <p className="mt-2 text-lg font-semibold">Anand Finance - Main Branch</p>
            <p className="mt-2 text-sm leading-7 text-white/70">
              Multi-company switching is scaffolded now and will be tied to user
              access rules in the next backend pass.
            </p>
          </div>
        </aside>

        <div className="flex min-h-full flex-col">
          <header className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Pawn Operations Console
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Built for customer onboarding, loan servicing, and audit-ready branch work.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]">
                <Search className="h-4 w-4" />
                <span>Ctrl + K for global search</span>
              </div>
              <div className="rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium text-white">
                Admin
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
