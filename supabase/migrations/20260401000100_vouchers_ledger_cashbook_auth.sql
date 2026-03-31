create type public.voucher_category as enum ('tea', 'snacks', 'fuel', 'salary', 'miscellaneous');
create type public.ledger_category as enum (
  'incoming_payment',
  'outgoing_loan',
  'deposit_received',
  'deposit_payout',
  'tea',
  'snacks',
  'fuel',
  'salary',
  'miscellaneous',
  'payment_adjustment'
);
create type public.ledger_direction as enum ('incoming', 'outgoing');
create type public.ledger_source_type as enum (
  'loan_disbursal',
  'loan_payment',
  'deposit_received',
  'deposit_payout',
  'voucher',
  'loan_payment_adjustment'
);
create type public.cash_book_status as enum ('balanced', 'excess', 'shortage');

create table public.voucher_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  voucher_date date not null,
  category public.voucher_category not null,
  payee text not null,
  remarks text,
  amount numeric(12,2) not null,
  supporting_document_paths jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (amount >= 0)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  entry_date date not null,
  category public.ledger_category not null,
  direction public.ledger_direction not null,
  description text not null,
  reference text not null,
  amount numeric(12,2) not null,
  source_type public.ledger_source_type not null,
  source_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (source_type, source_id),
  check (amount >= 0)
);

create table public.cash_book_days (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  book_date date not null,
  opening_balance numeric(12,2) not null default 0,
  total_incoming numeric(12,2) not null default 0,
  total_outgoing numeric(12,2) not null default 0,
  expected_closing_balance numeric(12,2) not null default 0,
  cash_in_hand numeric(12,2) not null default 0,
  reconciliation_difference numeric(12,2) not null default 0,
  status public.cash_book_status not null default 'balanced',
  remarks text,
  saved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, book_date)
);

create index idx_voucher_entries_company_id on public.voucher_entries(company_id);
create index idx_voucher_entries_voucher_date on public.voucher_entries(voucher_date desc);
create index idx_ledger_entries_company_id on public.ledger_entries(company_id);
create index idx_ledger_entries_entry_date on public.ledger_entries(entry_date desc);
create index idx_ledger_entries_category on public.ledger_entries(category);
create index idx_cash_book_days_company_id on public.cash_book_days(company_id);
create index idx_cash_book_days_book_date on public.cash_book_days(book_date desc);

create trigger trg_cash_book_days_updated_at
before update on public.cash_book_days
for each row
execute function public.set_updated_at();

alter table public.voucher_entries enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.cash_book_days enable row level security;

create policy "voucher_entries_select_by_company_access"
on public.voucher_entries
for select
to authenticated
using (public.is_admin() or public.has_company_access(company_id));

create policy "voucher_entries_insert_by_company_access"
on public.voucher_entries
for insert
to authenticated
with check (public.is_admin() or public.has_company_access(company_id));

create policy "ledger_entries_select_by_company_access"
on public.ledger_entries
for select
to authenticated
using (public.is_admin() or public.has_company_access(company_id));

create policy "ledger_entries_insert_by_company_access"
on public.ledger_entries
for insert
to authenticated
with check (public.is_admin() or public.has_company_access(company_id));

create policy "cash_book_days_select_by_company_access"
on public.cash_book_days
for select
to authenticated
using (public.is_admin() or public.has_company_access(company_id));

create policy "cash_book_days_insert_by_company_access"
on public.cash_book_days
for insert
to authenticated
with check (public.is_admin() or public.has_company_access(company_id));

create policy "cash_book_days_update_by_company_access"
on public.cash_book_days
for update
to authenticated
using (public.is_admin() or public.has_company_access(company_id))
with check (public.is_admin() or public.has_company_access(company_id));
