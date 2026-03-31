create sequence if not exists public.customer_code_seq start 100001;
create sequence if not exists public.depositor_code_seq start 200001;

create or replace function public.generate_customer_code()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.customer_code_seq');
  return lpad(next_number::text, 6, '0');
end;
$$;

create or replace function public.generate_depositor_code()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.depositor_code_seq');
  return lpad(next_number::text, 6, '0');
end;
$$;

create or replace function public.set_customer_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.customer_code is null or btrim(new.customer_code) = '' then
    new.customer_code := public.generate_customer_code();
  end if;

  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.set_customer_update_defaults()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.set_depositor_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.depositor_code is null or btrim(new.depositor_code) = '' then
    new.depositor_code := public.generate_depositor_code();
  end if;

  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.set_depositor_update_defaults()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    username,
    phone_number,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)),
    new.phone,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'staff')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_customers_defaults_insert on public.customers;
create trigger trg_customers_defaults_insert
before insert on public.customers
for each row
execute function public.set_customer_defaults();

drop trigger if exists trg_customers_defaults_update on public.customers;
create trigger trg_customers_defaults_update
before update on public.customers
for each row
execute function public.set_customer_update_defaults();

drop trigger if exists trg_depositors_defaults_insert on public.depositors;
create trigger trg_depositors_defaults_insert
before insert on public.depositors
for each row
execute function public.set_depositor_defaults();

drop trigger if exists trg_depositors_defaults_update on public.depositors;
create trigger trg_depositors_defaults_update
before update on public.depositors
for each row
execute function public.set_depositor_update_defaults();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
