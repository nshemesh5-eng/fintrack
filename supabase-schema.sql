-- Run this in Supabase SQL Editor (https://supabase.com → your project → SQL Editor)
-- Copy and paste everything below, then click "Run"

-- Transactions table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  category text not null,
  date date not null,
  created_at timestamptz default now()
);

-- Budgets table
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  month text not null, -- format: YYYY-MM
  created_at timestamptz default now(),
  unique(user_id, category, month)
);

-- Goals table
create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) default 0,
  deadline date not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (each user sees only their data)
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;

-- RLS Policies for transactions
create policy "Users can view own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions
  for delete using (auth.uid() = user_id);

-- RLS Policies for budgets
create policy "Users can view own budgets" on budgets
  for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on budgets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on budgets
  for update using (auth.uid() = user_id);

-- RLS Policies for goals
create policy "Users can view own goals" on goals
  for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals
  for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on goals
  for delete using (auth.uid() = user_id);
