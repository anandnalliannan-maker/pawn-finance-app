import { FundsInBook } from "@/components/funds-in/funds-in-book";

export default async function FundsInPage({
  searchParams,
}: PageProps<"/funds-in">) {
  const companyParam = (await searchParams).company;
  const company = Array.isArray(companyParam) ? companyParam[0] ?? "" : companyParam ?? "";
  return <FundsInBook selectedCompany={company} />;
}
