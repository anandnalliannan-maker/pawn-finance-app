alter type public.ledger_category add value if not exists 'funds_in';
alter type public.ledger_source_type add value if not exists 'funds_in';

create type public.funds_in_source_type as enum (
  'owner_capital',
  'partner_capital',
  'bank_withdrawal',
  'inter_branch_transfer',
  'other_funds'
);

create table public.funds_in_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  entry_date date not null,
  source_type public.funds_in_source_type not null,
  received_from text not null,
  amount numeric(12,2) not null,
  destination_account text,
  remarks text,
  supporting_document_paths jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (amount > 0)
);

create index idx_funds_in_entries_company_id on public.funds_in_entries(company_id);
create index idx_funds_in_entries_entry_date on public.funds_in_entries(entry_date desc);

alter table public.funds_in_entries enable row level security;

create policy "funds_in_entries_select_by_company_access"
on public.funds_in_entries
for select
to authenticated
using (public.is_admin() or public.has_company_access(company_id));

create policy "funds_in_entries_insert_by_company_access"
on public.funds_in_entries
for insert
to authenticated
with check (public.is_admin() or public.has_company_access(company_id));
