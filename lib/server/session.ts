import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "pawn_finance_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

type SessionCompany = {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
};

type SessionPayload = {
  userId: string;
  username: string;
  fullName: string;
  role: "admin" | "manager" | "staff";
  companies: SessionCompany[];
  expiresAt: number;
};

export type AppSession = SessionPayload;
export type AppSessionCompany = SessionCompany;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured for session signing.");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function encodeSession(session: Omit<SessionPayload, "expiresAt">, expiresAt = Date.now() + SESSION_DURATION_MS) {
  const payload = JSON.stringify({ ...session, expiresAt });
  const encodedPayload = toBase64Url(payload);
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function decodeSession(value?: string | null): AppSession | null {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.username || !payload.role || !Array.isArray(payload.companies) || payload.expiresAt <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getSessionFromCookie() {
  return decodeSession(await readSessionCookie());
}

export async function writeSessionCookie(session: Omit<SessionPayload, "expiresAt">) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const value = encodeSession(session, expiresAt);

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  return expiresAt;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
