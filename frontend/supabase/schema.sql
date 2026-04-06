create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  date timestamptz not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_created_at
  on public.transactions (user_id, created_at desc);

create index if not exists idx_transactions_user_date
  on public.transactions (user_id, date desc);
