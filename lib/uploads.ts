export const MAX_DOCUMENT_SIZE_BYTES = 500 * 1024;
export const MAX_LOAN_ATTACHMENTS = 3;
export const MAX_CUSTOMER_PHOTO_SIZE_BYTES = 1024 * 1024;

export type UploadContext = "customer-photo" | "customer-document" | "loan-document";

export async function uploadSelectedFiles(context: UploadContext, companyName: string, files: File[]) {
  if (!files.length) {
    return [] as string[];
  }

  const formData = new FormData();
  formData.append("context", context);
  formData.append("companyName", companyName);

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to upload files.");
  }

  return ((result.files ?? []) as Array<{ path: string }>).map((file) => file.path);
}
