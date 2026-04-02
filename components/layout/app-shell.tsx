"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronDown,
  CircleDollarSign,
  FileBarChart2,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  RotateCcw,
  Search,
  Settings,
  UsersRound,
} from "lucide-react";

type ShellCompany = {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
};

type NavChild = { label: string; href: string; hotkey?: string };
type NavItem = { label: string; href?: string; icon: typeof LayoutDashboard; children?: NavChild[]; roles?: Array<"admin" | "manager" | "staff"> };

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", icon: UsersRound, children: [
      { label: "New Customer", href: "/customers/new", hotkey: "F2" },
      { label: "Search Customer", href: "/customers", hotkey: "F3" },
    ] },
  { label: "Loans", icon: HandCoins, children: [
      { label: "Create New Loan", href: "/loans/new", hotkey: "F4" },
      { label: "Search Loan", href: "/loans/search", hotkey: "F5" },
      { label: "Schemes", href: "/schemes", hotkey: "F6" },
    ] },
  { label: "Deposits", icon: Landmark, children: [
      { label: "Create Deposit", href: "/deposits/new", hotkey: "F7" },
      { label: "Search Deposit", href: "/deposits/search", hotkey: "F8" },
    ] },
  { label: "Adjustments", href: "/adjustments", icon: RotateCcw },
  { label: "Vouchers", href: "/vouchers", icon: FileText },
  { label: "Ledger", href: "/ledger", icon: BookOpen },
  { label: "Cash Book", href: "/cash-book", icon: CircleDollarSign },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
  { label: "Admin", href: "/admin", icon: Settings, roles: ["admin"] },
];

function getSectionFromPath(pathname: string) {
  if (pathname.startsWith("/customers")) return "Customers";
  if (pathname.startsWith("/loans") || pathname.startsWith("/schemes")) return "Loans";
  if (pathname.startsWith("/deposits")) return "Deposits";
  return "";
}

function getSectionActive(label: string, pathname: string, href?: string) {
  if (href) return pathname === href || pathname.startsWith(`${href}/`);
  if (label === "Customers") return pathname.startsWith("/customers");
  if (label === "Loans") return pathname.startsWith("/loans") || pathname.startsWith("/schemes");
  if (label === "Deposits") return pathname.startsWith("/deposits");
  return false;
}

function buildHref(pathname: string, selectedCompany: string) {
  return `${pathname}?company=${encodeURIComponent(selectedCompany)}`;
}

function getBackLink(pathname: string, companyQuery: string) {
  if (pathname === "/customers/new") return { href: `/customers${companyQuery}`, label: "Back to customers" };
  if (pathname === "/loans/new" || pathname === "/loans/search" || pathname.startsWith("/loans/")) return { href: `/loans${companyQuery}`, label: "Back to loans" };
  if (pathname === "/deposits/new" || pathname === "/deposits/search" || pathname.startsWith("/deposits/")) return { href: `/deposits${companyQuery}`, label: "Back to deposits" };
  return null;
}

export function AppShell({
  children,
  companies,
  userRole,
  userName,
}: {
  children: ReactNode;
  companies: ShellCompany[];
  userRole: "admin" | "manager" | "staff";
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCompany = companies.find((company) => company.isDefault)?.name ?? companies[0]?.name ?? "";
  const selectedQueryCompany = searchParams.get("company") ?? defaultCompany;
  const selectedCompany = companies.some((company) => company.name === selectedQueryCompany) ? selectedQueryCompany : defaultCompany;
  const companyQuery = selectedCompany ? `?company=${encodeURIComponent(selectedCompany)}` : "";
  const [openSection, setOpenSection] = useState(() => getSectionFromPath(pathname));
  const backLink = getBackLink(pathname, companyQuery);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => !item.roles || item.roles.includes(userRole)),
    [userRole],
  );

  useEffect(() => {
    setOpenSection(getSectionFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    if (!searchParams.get("company") && selectedCompany) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("company", selectedCompany);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [pathname, router, searchParams, selectedCompany]);

  function handleCompanyChange(nextCompany: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("company", nextCompany);
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-screen overflow-hidden p-2 sm:p-3">
      <div className="mx-auto grid h-[calc(100vh-1rem)] max-w-[1720px] overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.55)] shadow-[0_40px_90px_rgba(54,39,19,0.15)] lg:grid-cols-[248px_1fr]">
        <aside className="flex h-full flex-col justify-between overflow-y-auto bg-[linear-gradient(180deg,#1f2937_0%,#243447_45%,#312217_100%)] p-5 text-white sm:p-6">
          <div>
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-white/12 p-3"><Building2 className="h-6 w-6 text-amber-200" /></div><div><p className="text-sm uppercase tracking-[0.18em] text-white/60">Branch Workspace</p><h1 className="text-xl font-semibold">Pawn Finance</h1></div></div>
            <nav className="mt-9 space-y-2">{visibleNavigation.map((item) => { const Icon = item.icon; const hasChildren = Boolean(item.children?.length); const isOpen = openSection === item.label; const isSectionActive = getSectionActive(item.label, pathname, item.href); return <div key={item.label} className="space-y-2">{hasChildren ? <button type="button" onClick={() => setOpenSection((current) => (current === item.label ? "" : item.label))} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${isSectionActive ? "bg-white/12 text-white" : "text-white/78 hover:bg-white/10 hover:text-white"}`}><span className="flex items-center gap-3"><Icon className="h-4 w-4" /><span>{item.label}</span></span><ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : "rotate-0"}`} /></button> : <Link href={selectedCompany ? buildHref(item.href!, selectedCompany) : item.href!} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isSectionActive ? "bg-white/12 text-white" : "text-white/78 hover:bg-white/10 hover:text-white"}`}><Icon className="h-4 w-4" /><span>{item.label}</span></Link>}{hasChildren && isOpen ? <div className="ml-7 space-y-2 border-l border-white/10 pl-4">{item.children?.map((child) => { const isChildActive = pathname === child.href; return <Link key={child.label} href={selectedCompany ? buildHref(child.href, selectedCompany) : child.href} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${isChildActive ? "bg-white/14 text-white" : "text-white/72 hover:bg-white/10 hover:text-white"}`}><span>{child.label}</span>{child.hotkey ? <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">{child.hotkey}</span> : null}</Link>; })}</div> : null}</div>; })}</nav>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/8 p-5"><p className="text-xs uppercase tracking-[0.18em] text-white/55">Signed in</p><p className="mt-2 text-base font-semibold leading-7">{userName}</p><p className="text-sm uppercase tracking-[0.16em] text-white/60">{userRole}</p></div>
        </aside>
        <div className="flex h-full min-h-0 flex-col overflow-hidden"><header className="relative flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-4 sm:px-6"><div className="min-w-[200px] text-sm font-medium text-[var(--color-ink)]">{backLink ? <Link href={backLink.href} className="inline-flex items-center gap-2 transition hover:text-[var(--color-accent-strong)]"><ArrowLeft className="h-4 w-4" />{backLink.label}</Link> : null}</div><div className="absolute left-1/2 top-1/2 w-[360px] max-w-[44vw] -translate-x-1/2 -translate-y-1/2">{companies.length ? <><select value={selectedCompany} onChange={(event) => handleCompanyChange(event.target.value)} className="w-full appearance-none rounded-full border border-[var(--color-border)] bg-white/90 px-5 py-3 text-sm font-semibold text-[var(--color-ink)] shadow-sm outline-none transition focus:border-[var(--color-accent)]">{companies.map((company) => <option key={company.id} value={company.name}>{company.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" /></> : null}</div><div className="flex items-center gap-3"><div className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]"><Search className="h-4 w-4" /><span>Search records</span></div><button type="button" onClick={handleLogout} className="rounded-2xl bg-[var(--color-sidebar)] px-4 py-3 text-sm font-medium capitalize text-white">{userRole}</button></div></header><main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</main></div>
      </div>
    </div>
  );
}

