export const GLOBAL_CUSTOMER_MASTER_LABEL = "All companies";
export const GLOBAL_CUSTOMER_UPLOAD_SCOPE = "global-customers";

export const customerIdProofTypes = [
  { key: "aadhaar", label: "Aadhaar" },
  { key: "pan", label: "PAN" },
  { key: "drivingLicense", label: "Driving License" },
  { key: "voterId", label: "Voter ID" },
  { key: "other", label: "Other" },
] as const;

export type CustomerIdProofKey = (typeof customerIdProofTypes)[number]["key"];
export type CustomerIdProofDocuments = Partial<Record<CustomerIdProofKey, string[]>>;

export type CustomerListItem = {
  id: string;
  customerCode: string;
  fullName: string;
  name: string;
  phoneNumber: string;
  phone: string;
  area: string;
  aadhaarNumber: string;
  aadhaar: string;
  company?: string;
  currentAddress?: string;
  permanentAddress?: string;
  guardianLabel?: string;
  guardianName?: string;
  referenceName?: string;
  remarks?: string;
  profilePhotoUrl?: string | null;
  photoUrl?: string;
  status?: string;
};

export type CreateCustomerPayload = {
  companyName: string;
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
  profilePhotoPath?: string;
  documentPaths?: CustomerIdProofDocuments;
};

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

export function normalizeAadhaar(value: string) {
  return value.replace(/\D/g, "");
}

export function buildCustomerStatus(item: CustomerListItem) {
  return item.aadhaar ? "Verified profile" : "Pending Aadhaar";
}
