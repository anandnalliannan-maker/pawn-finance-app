import { redirect } from "next/navigation";

import { requirePageSession } from "@/lib/server/auth";

export default async function HomePage() {
  const session = await requirePageSession();
  const defaultCompany = session.companies.find((company) => company.isDefault)?.name ?? session.companies[0]?.name;

  if (defaultCompany) {
    redirect(`/dashboard?company=${encodeURIComponent(defaultCompany)}`);
  }

  redirect("/select-company");
}
