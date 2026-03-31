create type public.scheme_status as enum ('active', 'inactive');
create type public.deposit_status as enum ('active', 'closed');
create type public.adjustment_status as enum ('posted');
create type public.adjustment_type as enum ('full_reversal', 'partial_adjustment');

create table public.loan_schemes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  code text not null unique,
  name text not null,
  status public.scheme_status not null default 'active',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.loan_scheme_slabs (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.loan_schemes(id) on delete cascade,
  line_no integer not null,
  start_day integer not null,
  end_day integer,
  interest_percent numeric(8,3) not null,
  created_at timestamptz not null default now(),
  unique (scheme_id, line_no),
  check (start_day > 0),
  check (end_day is null or end_day >= start_day)
);

create table public.loan_payment_adjustments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  original_payment_id uuid not null references public.loan_payments(id) on delete cascade,
  correction_type public.adjustment_type not null,
  principal_adjustment numeric(12,2) not null default 0,
  interest_adjustment numeric(12,2) not null default 0,
  corrected_payment_from date not null,
  corrected_payment_upto date not null,
  reason text not null,
  acknowledged_by text not null,
  status public.adjustment_status not null default 'posted',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (corrected_payment_upto >= corrected_payment_from)
);

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  depositor_id uuid not null references public.depositors(id),
  company_id uuid not null references public.companies(id),
  deposit_date date not null,
  deposit_amount numeric(12,2) not null,
  interest_percent numeric(8,3) not null default 0,
  reference_name text,
  address text,
  supporting_document_paths jsonb not null default '[]'::jsonb,
  status public.deposit_status not null default 'active',
  closed_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deposit_amount >= 0)
);

create table public.deposit_payments (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.deposits(id) on delete cascade,
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

create index idx_loan_schemes_company_id on public.loan_schemes(company_id);
create index idx_loan_scheme_slabs_scheme_id on public.loan_scheme_slabs(scheme_id);
create index idx_loan_payment_adjustments_loan_id on public.loan_payment_adjustments(loan_id);
create index idx_loan_payment_adjustments_payment_id on public.loan_payment_adjustments(original_payment_id);
create index idx_deposits_company_id on public.deposits(company_id);
create index idx_deposits_depositor_id on public.deposits(depositor_id);
create index idx_deposit_payments_deposit_id on public.deposit_payments(deposit_id);

create trigger trg_loan_schemes_updated_at
before update on public.loan_schemes
for each row
execute function public.set_updated_at();

create trigger trg_deposits_updated_at
before update on public.deposits
for each row
execute function public.set_updated_at();

alter table public.loan_schemes enable row level security;
alter table public.loan_scheme_slabs enable row level security;
alter table public.loan_payment_adjustments enable row level security;
alter table public.deposits enable row level security;
alter table public.deposit_payments enable row level security;

create policy "loan_schemes_select_by_company_access"
on public.loan_schemes
for select
to authenticated
using (public.is_admin() or public.has_company_access(company_id));

create policy "loan_schemes_insert_admin"
on public.loan_schemes
for insert
to authenticated
with check (public.is_admin());

create policy "loan_schemes_update_admin"
on public.loan_schemes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "loan_scheme_slabs_select_by_scheme_company_access"
on public.loan_scheme_slabs
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.loan_schemes s
    where s.id = scheme_id and public.has_company_access(s.company_id)
  )
);

create policy "loan_scheme_slabs_insert_admin"
on public.loan_scheme_slabs
for insert
to authenticated
with check (public.is_admin());

create policy "loan_payment_adjustments_select_by_loan_company_access"
on public.loan_payment_adjustments
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.loans l
    where l.id = loan_id and public.has_company_access(l.company_id)
  )
);

create policy "loan_payment_adjustments_insert_by_loan_company_access"
on public.loan_payment_adjustments
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.loans l
    where l.id = loan_id and public.has_company_access(l.company_id)
  )
);

create policy "deposits_select_by_company_access"
on public.deposits
for select
to authenticated
using (public.is_admin() or public.has_company_access(company_id));

create policy "deposits_insert_by_company_access"
on public.deposits
for insert
to authenticated
with check (public.is_admin() or public.has_company_access(company_id));

create policy "deposits_update_by_company_access"
on public.deposits
for update
to authenticated
using (public.is_admin() or public.has_company_access(company_id))
with check (public.is_admin() or public.has_company_access(company_id));

create policy "deposit_payments_select_by_deposit_company_access"
on public.deposit_payments
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.deposits d
    where d.id = deposit_id and public.has_company_access(d.company_id)
  )
);

create policy "deposit_payments_insert_by_deposit_company_access"
on public.deposit_payments
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.deposits d
    where d.id = deposit_id and public.has_company_access(d.company_id)
  )
);

insert into public.loan_schemes (company_id, code, name)
select c.id, seed.code, seed.name
from (
  values
    ('VBM001', 'scheme_daily_main', 'Daily'),
    ('VBM001', 'scheme_standard_main', 'Standard'),
    ('VBM001', 'scheme_premium_jewel_main', 'Premium Jewel')
) as seed(company_code, code, name)
join public.companies c on c.code = seed.company_code
on conflict (code) do nothing;

insert into public.loan_scheme_slabs (scheme_id, line_no, start_day, end_day, interest_percent)
select s.id, line_no, start_day, end_day, interest_percent
from (
  values
    ('scheme_daily_main', 1, 1, 30, 1.00),
    ('scheme_daily_main', 2, 31, 60, 2.50),
    ('scheme_standard_main', 1, 1, 30, 1.00),
    ('scheme_standard_main', 2, 31, 45, 2.00),
    ('scheme_premium_jewel_main', 1, 1, 30, 1.50),
    ('scheme_premium_jewel_main', 2, 31, 60, 2.25)
) as seed(code, line_no, start_day, end_day, interest_percent)
join public.loan_schemes s on s.code = seed.code
on conflict (scheme_id, line_no) do nothing;

