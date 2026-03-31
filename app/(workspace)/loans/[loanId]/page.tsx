import { notFound } from "next/navigation";

import { LoanDetailView } from "@/components/loans/loan-detail-view";
import { requirePageSession } from "@/lib/server/auth";
import { getLoanDetailById } from "@/lib/server/loans";

export default async function LoanDetailPage(props: PageProps<"/loans/[loanId]">) {
  const session = await requirePageSession();
  const { loanId } = await props.params;
  const loan = await getLoanDetailById(session, loanId);

  if (!loan) {
    notFound();
  }

  return <LoanDetailView loan={loan} />;
}
