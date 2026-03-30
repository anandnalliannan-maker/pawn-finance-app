import { notFound } from "next/navigation";

import { LoanDetailView } from "@/components/loans/loan-detail-view";
import { getLoanById } from "@/lib/loans";

export default async function LoanDetailPage(props: PageProps<"/loans/[loanId]">) {
  const { loanId } = await props.params;
  const loan = getLoanById(loanId);

  if (!loan) {
    notFound();
  }

  return <LoanDetailView loan={loan} />;
}
