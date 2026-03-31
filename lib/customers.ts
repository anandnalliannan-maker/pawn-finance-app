export type CustomerListItem = {
  id: string;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  currentAddress?: string;
  permanentAddress?: string;
  aadhaarNumber?: string;
  area: string;
  profilePhotoPath?: string | null;
  company: string;
  status: string;
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
};

export function normalizePhoneNumber(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function normalizeAadhaar(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function buildCustomerStatus(input: { profilePhotoPath?: string | null; aadhaarNumber?: string | null }) {
  if (input.profilePhotoPath) {
    return "Photo complete";
  }

  if (input.aadhaarNumber) {
    return "KYC complete";
  }

  return "Ready for loan issue";
}
