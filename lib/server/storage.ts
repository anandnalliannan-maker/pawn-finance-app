import { randomUUID } from "crypto";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const ATTACHMENTS_BUCKET = "app-attachments";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

async function ensureAttachmentsBucket() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage.getBucket(ATTACHMENTS_BUCKET);

  if (!error && data) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(ATTACHMENTS_BUCKET, {
    public: false,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message);
  }
}

export async function uploadAttachmentFiles(context: string, companyName: string, files: File[]) {
  const supabase = getSupabaseServerClient();
  await ensureAttachmentsBucket();
  const companyFolder = slugify(companyName);
  const uploaded: string[] = [];

  for (const file of files) {
    const fileExtension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
    const storagePath = `${context}/${companyFolder}/${Date.now()}-${randomUUID()}-${safeName}.${fileExtension}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    uploaded.push(storagePath);
  }

  return uploaded;
}

export async function getSignedAttachmentUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  await ensureAttachmentsBucket();
  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(path, 3600);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
