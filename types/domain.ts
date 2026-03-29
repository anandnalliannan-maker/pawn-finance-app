export type UserRole = "admin" | "staff" | "manager";

export type CompanySummary = {
  id: string;
  name: string;
  code: string;
  location: string;
};

export type CustomerSummary = {
  id: string;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  companyId: string;
};
