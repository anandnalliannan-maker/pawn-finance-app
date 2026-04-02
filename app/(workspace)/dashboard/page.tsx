import {
  ArrowUpRight,
  BadgeIndianRupee,
  FileSpreadsheet,
  Search,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/dashboard-action-card";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";

const metrics = [
  { label: "Active Loans", value: "1,248", trend: "+8.4%", tone: "amber" as const },
  { label: "Interest Due Today", value: "94", trend: "12 urgent", tone: "slate" as const },
  { label: "Customers", value: "5,632", trend: "+124 this month", tone: "teal" as const },
  { label: "Cash Position", value: "₹18.4L", trend: "Balanced", tone: "stone" as const },
];

const actions = [
  {
    title: "New Customer",
    description: "Register a customer, capture photo, and assign a six-digit customer ID.",
    icon: UsersRound,
    hotkey: "Alt + C",
  },
  {
    title: "Create Loan",
    description: "Start a cash loan or jewel loan with scheme and company selection.",
    icon: BadgeIndianRupee,
    hotkey: "Alt + L",
  },
  {
    title: "Interest Payment",
    description: "Update an existing loan with interest collection and receipt entry.",
    icon: WalletCards,
    hotkey: "Alt + P",
  },
  {
    title: "Search Records",
    description: "Find customers and loans by name, phone number, customer ID, or loan ID.",
    icon: Search,
    hotkey: "Alt + S",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#f6e7c4_0%,#fffaf0_55%,#f2e7d6_100%)] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Dashboard
          </p>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl">
            One operating surface for customer intake, loan servicing, and branch control.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-muted)]">
            This is the first working shell. The customer module plugs into these
            action lanes next, followed by loan issue and payment workflows.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {actions.map((action) => (
              <DashboardActionCard key={action.title} {...action} />
            ))}
          </div>
        </div>

        <div className="app-panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Search Preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Global lookup
              </h2>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel-strong)] p-3 text-[var(--color-accent-strong)]">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-white p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-page)] px-4 py-3 text-[var(--color-muted)]">
              <Search className="h-4 w-4" />
              <span>Search by customer name, phone number, customer ID, or loan ID</span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                "CUS102344  |  Priya S  |  98400 12345  |  Main Branch",
                "LN009812  |  Jewel Loan  |  Due on 31 Mar 2026",
                "CUS102198  |  Ramesh K  |  Pollachi Branch",
              ].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]"
                >
                  <span>{row}</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </section>
    </div>
  );
}

