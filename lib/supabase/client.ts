import { createClient } from "@supabase/supabase-js";

// Temporary untyped bridge until generated Supabase database types are added.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: ReturnType<typeof createClient<any>> | undefined;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  browserClient ??= createClient<any>(url, anonKey);
  return browserClient;
}
