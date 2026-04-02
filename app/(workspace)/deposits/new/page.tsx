import { DepositCreationForm } from "@/components/deposits/deposit-creation-form";

export default async function NewDepositPage({
  searchParams,
}: PageProps<"/deposits/new">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers";

  return <DepositCreationForm selectedCompany={company} />;
}
