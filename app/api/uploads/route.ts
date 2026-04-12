import { NextResponse } from "next/server";

import { GLOBAL_CUSTOMER_UPLOAD_SCOPE } from "@/lib/customers";
import {
  MAX_CUSTOMER_PHOTO_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_LOAN_ATTACHMENTS,
  type UploadContext,
} from "@/lib/uploads";
import { buildAuthErrorResponse, canAccessCompanyName, requireApiSession } from "@/lib/server/auth";
import { uploadAttachmentFiles } from "@/lib/server/storage";

export const runtime = "nodejs";

const validContexts: UploadContext[] = ["customer-photo", "customer-document", "loan-document"];

function isUploadContext(value: string): value is UploadContext {
  return validContexts.includes(value as UploadContext);
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const formData = await request.formData();
    const contextValue = formData.get("context");
    const companyNameValue = formData.get("companyName");

    if (typeof contextValue !== "string" || !isUploadContext(contextValue)) {
      return NextResponse.json({ error: "Invalid upload context." }, { status: 400 });
    }

    if (typeof companyNameValue !== "string" || !companyNameValue.trim()) {
      return NextResponse.json({ error: "Company is required for uploads." }, { status: 400 });
    }

    const normalizedCompanyScope = companyNameValue.trim();

    if (normalizedCompanyScope !== GLOBAL_CUSTOMER_UPLOAD_SCOPE && !canAccessCompanyName(session, normalizedCompanyScope)) {
      return NextResponse.json({ error: "You do not have access to the selected company." }, { status: 403 });
    }

    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!files.length) {
      return NextResponse.json({ error: "No files were selected." }, { status: 400 });
    }

    if (contextValue === "loan-document" && files.length > MAX_LOAN_ATTACHMENTS) {
      return NextResponse.json({ error: `Only ${MAX_LOAN_ATTACHMENTS} attachments are allowed for a loan.` }, { status: 400 });
    }

    for (const file of files) {
      if (contextValue === "customer-photo") {
        if (!file.type.startsWith("image/")) {
          return NextResponse.json({ error: "Customer photo must be an image file." }, { status: 400 });
        }
        if (file.size > MAX_CUSTOMER_PHOTO_SIZE_BYTES) {
          return NextResponse.json({ error: "Customer photo must be 1 MB or smaller." }, { status: 400 });
        }
      } else if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        return NextResponse.json({ error: "Each document must be 500 KB or smaller." }, { status: 400 });
      }
    }

    const folder = contextValue === "customer-photo"
      ? "customer-photos"
      : contextValue === "customer-document"
        ? "customer-documents"
        : "loan-documents";

    const paths = await uploadAttachmentFiles(folder, normalizedCompanyScope, files);
    return NextResponse.json({ files: paths.map((path) => ({ path })) }, { status: 201 });
  } catch (error) {
    const authResponse = buildAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload files." }, { status: 500 });
  }
}
