alter table public.loans
  add column if not exists disbursal_source_account text;

alter table public.voucher_entries
  add column if not exists source_account text;

alter table public.deposit_payments
  add column if not exists payout_source_account text;

alter table public.ledger_entries
  add column if not exists source_account text;

update public.ledger_entries
set source_account = metadata ->> 'sourceAccount'
where source_account is null
  and metadata ? 'sourceAccount';
