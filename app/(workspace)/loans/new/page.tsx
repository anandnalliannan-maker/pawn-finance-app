import { LoanCreationForm } from "@/components/loans/loan-creation-form";

export default async function NewLoanPage({
  searchParams,
}: PageProps<"/loans/new">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers - Main Branch";

  return <LoanCreationForm selectedCompany={company} />;
}
