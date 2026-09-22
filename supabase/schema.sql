-- ============================================================
-- HOME BANK — SCHEMA COMPLETO DE SUPABASE (PostgreSQL)
-- ============================================================
-- Ejecutar completo en el SQL Editor de un proyecto Supabase
-- nuevo para recrear toda la base de datos del proyecto.
-- ============================================================

-- ============================================
-- TABLA: profiles
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  dni text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ============================================
-- TABLA: accounts
-- ============================================
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_type text not null check (account_type in ('savings', 'checking')),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  balance numeric(15, 2) not null default 0,
  alias text unique,
  cbu text unique,
  created_at timestamp with time zone default now()
);

alter table accounts enable row level security;

drop policy if exists "Users can view own accounts" on accounts;
create policy "Users can view own accounts"
  on accounts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own accounts" on accounts;
create policy "Users can insert own accounts"
  on accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own accounts" on accounts;
create policy "Users can update own accounts"
  on accounts for update
  using (auth.uid() = user_id);

-- ============================================
-- TABLA: transactions
-- ============================================
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references accounts on delete cascade not null,
  type text not null check (type in ('income', 'expense', 'transfer_in', 'transfer_out')),
  amount numeric(15, 2) not null,
  description text,
  category text,
  created_at timestamp with time zone default now()
);

alter table transactions enable row level security;

drop policy if exists "Users can view own transactions" on transactions;
create policy "Users can view own transactions"
  on transactions for select
  using (
    account_id in (select id from accounts where user_id = auth.uid())
  );

drop policy if exists "Users can insert own transactions" on transactions;
create policy "Users can insert own transactions"
  on transactions for insert
  with check (
    account_id in (select id from accounts where user_id = auth.uid())
  );

-- ============================================
-- TABLA: cards
-- ============================================
create table if not exists cards (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references accounts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  card_type text not null check (card_type in ('debit', 'credit')),
  card_number text not null,
  card_holder text not null,
  expiry_date text not null,
  cvv text not null,
  credit_limit numeric(15, 2) default 0,
  is_blocked boolean default false,
  created_at timestamp with time zone default now()
);

alter table cards enable row level security;

drop policy if exists "Users can view own cards" on cards;
create policy "Users can view own cards"
  on cards for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own cards" on cards;
create policy "Users can update own cards"
  on cards for update
  using (auth.uid() = user_id);

-- ============================================
-- TABLA: bills
-- ============================================
create table if not exists bills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete cascade not null,
  company_name text not null,
  category text not null,
  amount numeric(15, 2) not null,
  due_date date not null,
  is_paid boolean default false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table bills enable row level security;

drop policy if exists "Users can view own bills" on bills;
create policy "Users can view own bills"
  on bills for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bills" on bills;
create policy "Users can insert own bills"
  on bills for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bills" on bills;
create policy "Users can update own bills"
  on bills for update
  using (auth.uid() = user_id);

-- ============================================
-- TABLA: investments (plazo fijo)
-- ============================================
create table if not exists investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete cascade not null,
  amount numeric(15, 2) not null,
  interest_rate numeric(5, 2) not null,
  term_days integer not null,
  created_at timestamp with time zone default now(),
  maturity_date date not null,
  is_closed boolean default false
);

alter table investments enable row level security;

drop policy if exists "Users can view own investments" on investments;
create policy "Users can view own investments"
  on investments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own investments" on investments;
create policy "Users can insert own investments"
  on investments for insert
  with check (auth.uid() = user_id);

-- ============================================
-- TABLA: loans (préstamos)
-- ============================================
create table if not exists loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete cascade not null,
  amount numeric(15, 2) not null,
  interest_rate numeric(5, 2) not null,
  installments integer not null,
  installment_amount numeric(15, 2) not null,
  status text default 'active' check (status in ('active', 'paid', 'defaulted')),
  created_at timestamp with time zone default now()
);

alter table loans enable row level security;

drop policy if exists "Users can view own loans" on loans;
create policy "Users can view own loans"
  on loans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own loans" on loans;
create policy "Users can insert own loans"
  on loans for insert
  with check (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN + TRIGGER: crear profile, cuenta y tarjeta al registrarse
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_account_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into public.accounts (user_id, account_type, currency, balance, alias, cbu)
  values (
    new.id,
    'savings',
    'ARS',
    50000,
    lower(replace(new.raw_user_meta_data->>'full_name', ' ', '.')) || '.homebank',
    '0000003100' || floor(random() * 100000000000)::text
  )
  returning id into new_account_id;

  insert into public.cards (account_id, user_id, card_type, card_number, card_holder, expiry_date, cvv, credit_limit)
  values (
    new_account_id,
    new.id,
    'debit',
    '4' || floor(random() * 1000000000000000)::text,
    upper(coalesce(new.raw_user_meta_data->>'full_name', 'USUARIO')),
    to_char(now() + interval '4 years', 'MM/YY'),
    lpad(floor(random() * 1000)::text, 3, '0'),
    0
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FUNCIÓN: transferencia atómica de dinero
-- ============================================
create or replace function transfer_money(
  origin_account_id uuid,
  destination_alias text,
  transfer_amount numeric,
  transfer_description text default 'Transferencia'
)
returns json as $$
declare
  origin_balance numeric;
  destination_account_id uuid;
  destination_user_id uuid;
begin
  if transfer_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  select id, user_id into destination_account_id, destination_user_id
  from accounts
  where alias = destination_alias;

  if destination_account_id is null then
    raise exception 'No se encontró ninguna cuenta con ese alias';
  end if;

  if destination_account_id = origin_account_id then
    raise exception 'No podés transferirte a la misma cuenta';
  end if;

  select balance into origin_balance
  from accounts
  where id = origin_account_id
  for update;

  if origin_balance < transfer_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts
  set balance = balance - transfer_amount
  where id = origin_account_id;

  update accounts
  set balance = balance + transfer_amount
  where id = destination_account_id;

  insert into transactions (account_id, type, amount, description, category)
  values (origin_account_id, 'transfer_out', transfer_amount, transfer_description, 'Transferencia enviada');

  insert into transactions (account_id, type, amount, description, category)
  values (destination_account_id, 'transfer_in', transfer_amount, transfer_description, 'Transferencia recibida');

  return json_build_object('success', true, 'new_balance', origin_balance - transfer_amount);
end;
$$ language plpgsql security definer;

grant execute on function transfer_money to authenticated;

-- ============================================
-- FUNCIÓN: pago atómico de servicios
-- ============================================
create or replace function pay_bill(
  bill_id uuid,
  paying_account_id uuid
)
returns json as $$
declare
  bill_amount numeric;
  bill_is_paid boolean;
  account_balance numeric;
begin
  select amount, is_paid into bill_amount, bill_is_paid
  from bills
  where id = bill_id;

  if bill_amount is null then
    raise exception 'No se encontró el servicio a pagar';
  end if;

  if bill_is_paid then
    raise exception 'Este servicio ya fue pagado';
  end if;

  select balance into account_balance
  from accounts
  where id = paying_account_id
  for update;

  if account_balance < bill_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts
  set balance = balance - bill_amount
  where id = paying_account_id;

  update bills
  set is_paid = true, paid_at = now()
  where id = bill_id;

  insert into transactions (account_id, type, amount, description, category)
  select paying_account_id, 'expense', bill_amount, company_name, category
  from bills
  where id = bill_id;

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

grant execute on function pay_bill to authenticated;

-- ============================================
-- FUNCIÓN: crear plazo fijo
-- ============================================
create or replace function create_investment(
  investing_account_id uuid,
  investment_amount numeric,
  investment_rate numeric,
  investment_term_days integer
)
returns json as $$
declare
  account_balance numeric;
  new_investment_id uuid;
begin
  if investment_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  select balance into account_balance
  from accounts
  where id = investing_account_id
  for update;

  if account_balance < investment_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts
  set balance = balance - investment_amount
  where id = investing_account_id;

  insert into investments (user_id, account_id, amount, interest_rate, term_days, maturity_date)
  select user_id, investing_account_id, investment_amount, investment_rate, investment_term_days,
         current_date + investment_term_days
  from accounts
  where id = investing_account_id
  returning id into new_investment_id;

  insert into transactions (account_id, type, amount, description, category)
  values (investing_account_id, 'expense', investment_amount, 'Plazo fijo constituido', 'Inversión');

  return json_build_object('success', true, 'investment_id', new_investment_id);
end;
$$ language plpgsql security definer;

grant execute on function create_investment to authenticated;

-- ============================================
-- FUNCIÓN: solicitar préstamo
-- ============================================
create or replace function request_loan(
  loan_account_id uuid,
  loan_amount numeric,
  loan_rate numeric,
  loan_installments integer
)
returns json as $$
declare
  new_loan_id uuid;
  total_with_interest numeric;
  monthly_installment numeric;
begin
  if loan_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  total_with_interest := loan_amount * (1 + (loan_rate / 100));
  monthly_installment := total_with_interest / loan_installments;

  insert into loans (user_id, account_id, amount, interest_rate, installments, installment_amount)
  select user_id, loan_account_id, loan_amount, loan_rate, loan_installments, monthly_installment
  from accounts
  where id = loan_account_id
  returning id into new_loan_id;

  update accounts
  set balance = balance + loan_amount
  where id = loan_account_id;

  insert into transactions (account_id, type, amount, description, category)
  values (loan_account_id, 'income', loan_amount, 'Préstamo acreditado', 'Préstamo');

  return json_build_object('success', true, 'loan_id', new_loan_id, 'installment_amount', monthly_installment);
end;
$$ language plpgsql security definer;

grant execute on function request_loan to authenticated;

-- ============================================
-- POLÍTICA: permitir agregar tarjetas nuevas desde la app
-- ============================================
drop policy if exists "Users can insert own cards" on cards;
create policy "Users can insert own cards"
  on cards for insert
  with check (auth.uid() = user_id);