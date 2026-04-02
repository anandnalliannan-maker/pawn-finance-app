alter table public.customers
  add column if not exists id_proof_document_paths jsonb not null default '[]'::jsonb;

alter table public.loans
  drop constraint if exists loans_supporting_document_paths_limit;

alter table public.loans
  add constraint loans_supporting_document_paths_limit
  check (
    jsonb_typeof(supporting_document_paths) = 'array'
    and jsonb_array_length(supporting_document_paths) <= 3
  );

update public.companies
set code = 'VB001',
    name = 'Vishnu Bankers',
    short_name = 'Vishnu'
where name = 'Vishnu Bankers - Main Branch' or code = 'VBM001';

update public.companies
set code = 'AF001',
    name = 'Arya Finance',
    short_name = 'Arya'
where name = 'Vishnu Bankers - Town Office' or code = 'VBT002';

update public.companies
set code = 'SC001',
    name = 'Sai Credits',
    short_name = 'Sai'
where name = 'Vishnu Bankers - Gold Unit' or code = 'VBG003';
