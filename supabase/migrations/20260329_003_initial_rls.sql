alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_company_access enable row level security;
alter table public.customers enable row level security;
alter table public.customer_audit_log enable row level security;
alter table public.depositors enable row level security;
alter table public.depositor_audit_log enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

create or replace function public.has_company_access(target_company_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_company_access uca
    join public.profiles p on p.id = uca.user_id
    where uca.user_id = auth.uid()
      and uca.company_id = target_company_id
      and p.is_active = true
  );
$$;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or public.is_admin()
);

create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid() or public.is_admin()
)
with check (
  id = auth.uid() or public.is_admin()
);

create policy "companies_select_by_access"
on public.companies
for select
to authenticated
using (
  public.is_admin()
  or public.has_company_access(id)
);

create policy "companies_insert_admin"
on public.companies
for insert
to authenticated
with check (
  public.is_admin()
);

create policy "companies_update_admin"
on public.companies
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

create policy "user_company_access_select_own_or_admin"
on public.user_company_access
for select
to authenticated
using (
  user_id = auth.uid() or public.is_admin()
);

create policy "user_company_access_insert_admin"
on public.user_company_access
for insert
to authenticated
with check (
  public.is_admin()
);

create policy "user_company_access_update_admin"
on public.user_company_access
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

create policy "customers_select_by_company_access"
on public.customers
for select
to authenticated
using (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "customers_insert_by_company_access"
on public.customers
for insert
to authenticated
with check (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "customers_update_by_company_access"
on public.customers
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

create policy "customer_audit_log_select_by_customer_company_access"
on public.customer_audit_log
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.customers c
    where c.id = customer_id
      and public.has_company_access(c.company_id)
  )
);

create policy "customer_audit_log_insert_by_customer_company_access"
on public.customer_audit_log
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.customers c
    where c.id = customer_id
      and public.has_company_access(c.company_id)
  )
);

create policy "depositors_select_by_company_access"
on public.depositors
for select
to authenticated
using (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "depositors_insert_by_company_access"
on public.depositors
for insert
to authenticated
with check (
  public.is_admin()
  or public.has_company_access(company_id)
);

create policy "depositors_update_by_company_access"
on public.depositors
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

create policy "depositor_audit_log_select_by_depositor_company_access"
on public.depositor_audit_log
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.depositors d
    where d.id = depositor_id
      and public.has_company_access(d.company_id)
  )
);

create policy "depositor_audit_log_insert_by_depositor_company_access"
on public.depositor_audit_log
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.depositors d
    where d.id = depositor_id
      and public.has_company_access(d.company_id)
  )
);
