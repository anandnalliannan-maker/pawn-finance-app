create table if not exists public.area_master (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text not null unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

insert into public.area_master (name, name_normalized)
select distinct trim(area), lower(trim(area))
from public.customers
where area is not null and btrim(area) <> ''
on conflict (name_normalized) do nothing;

alter table public.area_master enable row level security;

drop policy if exists "area_master_select_authenticated" on public.area_master;
create policy "area_master_select_authenticated"
on public.area_master
for select
to authenticated
using (true);

drop policy if exists "area_master_insert_authenticated" on public.area_master;
create policy "area_master_insert_authenticated"
on public.area_master
for insert
to authenticated
with check (auth.uid() is not null);
