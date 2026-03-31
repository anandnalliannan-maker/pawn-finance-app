import { LedgerBook } from "@/components/ledger/ledger-book";

export default async function LedgerPage({
  searchParams,
}: PageProps<"/ledger">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers - Main Branch";

  return <LedgerBook selectedCompany={company} />;
}
