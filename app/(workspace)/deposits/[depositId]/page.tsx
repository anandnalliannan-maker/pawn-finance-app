import { notFound } from "next/navigation";

import { DepositDetailView } from "@/components/deposits/deposit-detail-view";
import { getDepositById } from "@/lib/deposits";

export default async function DepositDetailPage(props: PageProps<"/deposits/[depositId]">) {
  const { depositId } = await props.params;
  const deposit = getDepositById(depositId);

  if (!deposit) {
    notFound();
  }

  return <DepositDetailView deposit={deposit} />;
}
