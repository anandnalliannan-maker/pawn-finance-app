import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  clearSessionCookie,
  getSessionFromCookie,
  writeSessionCookie,
  type AppSession,
  type AppSessionCompany,
} from "@/lib/server/session";

export type { AppSession, AppSessionCompany } from "@/lib/server/session";

type ProfileRow = {
  id: string;
  full_name: string;
  username: string;
  role: "admin" | "manager" | "staff";
  is_active: boolean;
};

type CompanyAccessRow = {
  is_default: boolean;
  companies: { id: string; code: string; name: string } | { id: string; code: string; name: string }[] | null;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return [] as T[];
  }
  return Array.isArray(value) ? value : [value];
}

function getAnonSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function listAccessibleCompanies(profileId: string, role: AppSession["role"]) {
  const supabase = getSupabaseServerClient();

  if (role === "admin") {
    const { data, error } = await supabase
      .from("companies")
      .select("id, code, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((company) => ({
      id: company.id as string,
      code: company.code as string,
      name: company.name as string,
      isDefault: false,
    }));
  }

  const { data, error } = await supabase
    .from("user_company_access")
    .select("is_default, companies!inner(id, code, name)")
    .eq("user_id", profileId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CompanyAccessRow[])
    .map((row) => {
      const company = asArray(row.companies)[0];
      if (!company) {
        return null;
      }

      return {
        id: company.id,
        code: company.code,
        name: company.name,
        isDefault: row.is_default,
      } satisfies AppSessionCompany;
    })
    .filter((company): company is AppSessionCompany => Boolean(company));
}

export async function loginWithUsernamePassword(username: string, password: string) {
  const normalizedUsername = username.trim();
  const supabase = getSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, is_active")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const userProfile = profile as ProfileRow | null;
  if (!userProfile || !userProfile.is_active) {
    throw new Error("Invalid username or password.");
  }

  const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userProfile.id);
  if (authUserError) {
    throw new Error(authUserError.message);
  }

  const email = authUserData.user?.email;
  if (!email) {
    throw new Error("This user does not have a login email configured in Supabase Auth.");
  }

  const authClient = getAnonSupabaseServerClient();
  const { error: signInError } = await authClient.auth.signInWithPassword({ email, password });
  if (signInError) {
    throw new Error("Invalid username or password.");
  }

  const companies = await listAccessibleCompanies(userProfile.id, userProfile.role);

  await writeSessionCookie({
    userId: userProfile.id,
    username: userProfile.username,
    fullName: userProfile.full_name,
    role: userProfile.role,
    companies,
  });

  return {
    userId: userProfile.id,
    fullName: userProfile.full_name,
    username: userProfile.username,
    role: userProfile.role,
    companies,
  };
}

export async function logoutCurrentUser() {
  await clearSessionCookie();
}

export const getCurrentSession = cache(async () => getSessionFromCookie());

export async function requirePageSession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function redirectIfAuthenticated() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/select-company");
  }
}

export async function requireApiSession(options?: { roles?: AppSession["role"][] }) {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("AUTH_REQUIRED");
  }

  if (options?.roles?.length && !options.roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export function buildAuthErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return Response.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }

  return null;
}

export function getDefaultCompanyName(session: AppSession) {
  return session.companies.find((company) => company.isDefault)?.name ?? session.companies[0]?.name ?? "";
}

export function canAccessCompanyName(session: AppSession, companyName: string) {
  return session.role === "admin" || session.companies.some((company) => company.name === companyName);
}

export function canAccessCompanyId(session: AppSession, companyId: string) {
  return session.role === "admin" || session.companies.some((company) => company.id === companyId);
}
