insert into public.companies (
  code,
  name,
  short_name,
  city,
  state,
  country,
  is_active
)
values
  ('VBM001', 'Vishnu Bankers - Main Branch', 'Main Branch', 'Coimbatore', 'Tamil Nadu', 'India', true),
  ('VBT002', 'Vishnu Bankers - Town Office', 'Town Office', 'Coimbatore', 'Tamil Nadu', 'India', true),
  ('VBG003', 'Vishnu Bankers - Gold Unit', 'Gold Unit', 'Tiruppur', 'Tamil Nadu', 'India', true)
on conflict (code) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  city = excluded.city,
  state = excluded.state,
  country = excluded.country,
  is_active = excluded.is_active;

alter table public.customers
  add column if not exists phone_number_normalized text generated always as (regexp_replace(coalesce(phone_number, ''), '\s+', '', 'g')) stored,
  add column if not exists aadhaar_number_normalized text generated always as (nullif(regexp_replace(coalesce(aadhaar_number, ''), '\s+', '', 'g'), '')) stored,
  add column if not exists id_proof_paths jsonb not null default '[]'::jsonb;

create unique index if not exists idx_customers_phone_number_normalized_unique
  on public.customers (phone_number_normalized);

create unique index if not exists idx_customers_aadhaar_number_normalized_unique
  on public.customers (aadhaar_number_normalized)
  where aadhaar_number_normalized is not null;