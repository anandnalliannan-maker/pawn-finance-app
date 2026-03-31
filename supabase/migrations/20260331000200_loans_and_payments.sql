create type public.loan_status as enum ('active', 'closed');

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  account_number text not null unique,
  account_number_sequence integer not null,
  financial_year_start integer not null,
  financial_year_label text not null,
  customer_id uuid not null references public.customers(id),
  company_id uuid not null references public.companies(id),
  loan_date date not null,
  loan_type public.loan_type not null,
  scheme_name text,
  interest_percent numeric(8,3) not null default 0,
  original_loan_amount numeric(12,2) not null,
  supporting_document_paths jsonb not null default '[]'::jsonb,
  status public.loan_status not null default 'active',
  closed_at timestamptz,
  closed_by uuid references public.profiles(id),
  close_remarks text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (account_number_sequence > 0),
  check (original_loan_amount >= 0)
);

create table public.loan_jewel_items (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  line_no integer not null,
  jewel_type text not null,
  jewel_weight numeric(10,3) not null default 0,
  stone_weight numeric(10,3) not null default 0,
  gold_weight numeric(10,3) generated always as (greatest(jewel_weight - stone_weight, 0)) stored,
  created_at timestamptz not null default now(),
  unique (loan_id, line_no),
  check (jewel_weight >= 0),
  check (stone_weight >= 0)
);

create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  payment_date date not null,
  payment_from date not null,
  payment_upto date not null,
  principal_payment numeric(12,2) not null default 0,
  interest_payment numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (principal_payment >= 0),
  check (interest_payment >= 0),
  check (payment_upto >= payment_from)
);

create index idx_loans_company_id on public.loans(company_id);
create index idx_loans_customer_id on public.loans(customer_id);
create index idx_loans_loan_date on public.loans(loan_date desc);
create index idx_loans_status on public.loans(status);
create index idx_loans_account_number_sequence on public.loans(financial_year_label, account_number_sequence desc);
create index idx_loan_jewel_items_loan_id on public.loan_jewel_items(loan_id);
create index idx_loan_payments_loan_id on public.loan_payments(loan_id);
create index idx_loan_payments_payment_date on public.loan_payments(payment_date desc);

create trigger trg_loans_updated_at
before update on public.loans
for each row
execute function public.set_updated_at();

alter table public.loans enable row level security;
alter table public.loan_jewel_items enable row level security;
alter table public.loan_payments enable row level security;

create policy "loans_select_by_company_access"
on public.loans
for select
to authenticated
using (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "loans_insert_by_company_access"
on public.loans
for insert
to authenticated
with check (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "loans_update_by_company_access"
on public.loans
for update
to authenticated
using (
  public.is_admin()
  or public.has_company_access(company_id)
)
with check (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "loan_jewel_items_select_by_loan_company_access"
on public.loan_jewel_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and public.has_company_access(l.company_id)
  )
);

create policy "loan_jewel_items_insert_by_loan_company_access"
on public.loan_jewel_items
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and public.has_company_access(l.company_id)
  )
);

create policy "loan_payments_select_by_loan_company_access"
on public.loan_payments
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and public.has_company_access(l.company_id)
  )
);

create policy "loan_payments_insert_by_loan_company_access"
on public.loan_payments
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and public.has_company_access(l.company_id)
  )
);
