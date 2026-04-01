alter table public.loan_payments drop constraint if exists loan_payments_principal_payment_check;
alter table public.loan_payments drop constraint if exists loan_payments_interest_payment_check;
