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
  area?: string;
  remarks?: string;
};

export type CustomerFormInput = {
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  aadhaarNumber?: string;
  guardianLabel?: string;
  guardianName?: string;
  area?: string;
  referenceName?: string;
  remarks?: string;
};
