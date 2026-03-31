import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requirePageSession } from "@/lib/server/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePageSession();

  return (
    <AppShell
      userRole={session.role}
      userName={session.fullName}
      companies={session.companies}
    >
      {children}
    </AppShell>
  );
}
