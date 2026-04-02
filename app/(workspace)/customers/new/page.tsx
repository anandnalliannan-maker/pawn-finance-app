import { CustomerRegistrationForm } from "@/components/customers/customer-registration-form";

export default async function NewCustomerPage({
  searchParams,
}: PageProps<"/customers/new">) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : "Vishnu Bankers";

  return <CustomerRegistrationForm selectedCompany={company} />;
}
