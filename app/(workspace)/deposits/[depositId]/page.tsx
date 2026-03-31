import { notFound } from "next/navigation";

import { DepositDetailView } from "@/components/deposits/deposit-detail-view";
import { requirePageSession } from "@/lib/server/auth";
import { getDepositDetailById } from "@/lib/server/deposits";

export default async function DepositDetailPage(props: PageProps<"/deposits/[depositId]">) {
  const session = await requirePageSession();
  const { depositId } = await props.params;
  const deposit = await getDepositDetailById(session, depositId);

  if (!deposit) {
    notFound();
  }

  return <DepositDetailView deposit={deposit} />;
}
