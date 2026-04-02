import { VoucherBook } from "@/components/vouchers/voucher-book";

export default async function VouchersPage({
  searchParams,
}: PageProps<"/vouchers">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers";

  return <VoucherBook selectedCompany={company} />;
}
