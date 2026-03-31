import { CashBookView } from "@/components/cash-book/cash-book-view";

export default async function CashBookPage({
  searchParams,
}: PageProps<"/cash-book">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers - Main Branch";

  return <CashBookView selectedCompany={company} />;
}
