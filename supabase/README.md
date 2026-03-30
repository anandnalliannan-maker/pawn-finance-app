# Supabase Workflow

This folder keeps database changes versioned in Git instead of relying on manual SQL edits in the Supabase dashboard.

Current migrations:

- `20260329_001_core_schema.sql`
- `20260329_002_defaults_and_auth.sql`
- `20260329_003_initial_rls.sql`

Recommended next step:

1. Install the Supabase CLI locally.
2. Link this repo to the Supabase project.
3. Apply future schema changes through migration files first.

Important:

- `.env.local` stays at the project root and must never be committed.
- The frontend uses the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Do not use the `service_role` key in client-side code.
