create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'manager', 'staff');
create type public.loan_type as enum ('cash_loan', 'jewel_loan');
create type public.party_type as enum ('individual', 'company');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_name text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text default 'India',
  phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  phone_number text,
  role public.app_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_company_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  company_id uuid not null references public.companies(id),
  full_name text not null,
  phone_number text not null,
  alternate_phone_number text,
  current_address text,
  permanent_address text,
  aadhaar_number text,
  guardian_label text,
  guardian_name text,
  area text,
  reference_name text,
  remarks text,
  profile_photo_path text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_audit_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  action text not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create table public.depositors (
  id uuid primary key default gen_random_uuid(),
  depositor_code text not null unique,
  company_id uuid not null references public.companies(id),
  party_type public.party_type not null,
  display_name text not null,
  contact_person_name text,
  phone_number text,
  alternate_phone_number text,
  address text,
  city text,
  state text,
  postal_code text,
  aadhaar_number text,
  pan_number text,
  remarks text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.depositor_audit_log (
  id uuid primary key default gen_random_uuid(),
  depositor_id uuid not null references public.depositors(id) on delete cascade,
  action text not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index idx_profiles_role on public.profiles(role);
create index idx_user_company_access_user_id on public.user_company_access(user_id);
create index idx_user_company_access_company_id on public.user_company_access(company_id);
create index idx_customers_company_id on public.customers(company_id);
create index idx_customers_phone_number on public.customers(phone_number);
create index idx_customer_audit_log_customer_id on public.customer_audit_log(customer_id);
create index idx_customer_audit_log_changed_at on public.customer_audit_log(changed_at desc);
create index idx_depositors_company_id on public.depositors(company_id);
create index idx_depositors_phone_number on public.depositors(phone_number);
create index idx_depositors_party_type on public.depositors(party_type);
create index idx_depositor_audit_log_depositor_id on public.depositor_audit_log(depositor_id);
create index idx_depositor_audit_log_changed_at on public.depositor_audit_log(changed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_companies_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger trg_depositors_updated_at
before update on public.depositors
for each row
execute function public.set_updated_at();
