import { createClient } from "@supabase/supabase-js";

// Temporary untyped bridge until generated Supabase database types are added.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serverClient: ReturnType<typeof createClient<any>> | undefined;

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverClient ??= createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
