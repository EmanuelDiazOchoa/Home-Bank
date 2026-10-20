-- ============================================================
-- HOME BANK — SCHEMA COMPLETO DE SUPABASE (PostgreSQL)
-- ============================================================
-- Es idempotente: se puede ejecutar completo, tantas veces como
-- haga falta, en un proyecto nuevo o sobre uno ya existente.
--
-- Principio de seguridad: el cliente solo puede LEER sus datos.
-- Todo lo que cambia saldos o crea registros financieros pasa por
-- funciones SQL que validan la identidad (auth.uid()) en el servidor.
-- ============================================================

-- ============================================
-- TABLAS
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  dni text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

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

create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references accounts on delete cascade not null,
  type text not null check (type in ('income', 'expense', 'transfer_in', 'transfer_out')),
  amount numeric(15, 2) not null,
  description text,
  category text,
  created_at timestamp with time zone default now()
);

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

-- El saldo nunca puede quedar negativo (red de seguridad extra)
alter table accounts drop constraint if exists accounts_balance_non_negative;
alter table accounts add constraint accounts_balance_non_negative check (balance >= 0);

-- ============================================
-- ROW LEVEL SECURITY: lectura de datos propios
-- ============================================
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table cards enable row level security;
alter table bills enable row level security;
alter table investments enable row level security;
alter table loans enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "Users can view own accounts" on accounts;
create policy "Users can view own accounts"
  on accounts for select using (auth.uid() = user_id);

drop policy if exists "Users can view own transactions" on transactions;
create policy "Users can view own transactions"
  on transactions for select
  using (account_id in (select id from accounts where user_id = auth.uid()));

drop policy if exists "Users can view own cards" on cards;
create policy "Users can view own cards"
  on cards for select using (auth.uid() = user_id);

drop policy if exists "Users can update own cards" on cards;
create policy "Users can update own cards"
  on cards for update using (auth.uid() = user_id);

drop policy if exists "Users can view own bills" on bills;
create policy "Users can view own bills"
  on bills for select using (auth.uid() = user_id);

drop policy if exists "Users can view own investments" on investments;
create policy "Users can view own investments"
  on investments for select using (auth.uid() = user_id);

drop policy if exists "Users can view own loans" on loans;
create policy "Users can view own loans"
  on loans for select using (auth.uid() = user_id);

-- ============================================
-- ALTA DE USUARIO: perfil + cuenta + tarjeta + servicios de ejemplo
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_account_id uuid;
  v_base text;
  v_alias text;
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(v_name), ''));

  -- Alias legible (sin tildes ni símbolos) y único: si ya existe, suma un sufijo
  v_base := regexp_replace(translate(lower(v_name), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]+', '.', 'g');
  v_base := trim(both '.' from v_base);
  if v_base = '' then v_base := 'usuario'; end if;
  v_alias := v_base || '.homebank';
  while exists (select 1 from public.accounts where alias = v_alias) loop
    v_alias := v_base || '.' || (100 + floor(random() * 900))::int || '.homebank';
  end loop;

  insert into public.accounts (user_id, account_type, currency, balance, alias, cbu)
  values (
    new.id, 'savings', 'ARS', 50000, v_alias,
    '0000003100' || lpad(floor(random() * 1000000000000)::bigint::text, 12, '0')
  )
  returning id into v_account_id;

  insert into public.cards (account_id, user_id, card_type, card_number, card_holder, expiry_date, cvv, credit_limit)
  values (
    v_account_id, new.id, 'debit',
    '4' || lpad(floor(random() * 1000000000000000)::bigint::text, 15, '0'),
    upper(coalesce(nullif(trim(v_name), ''), 'USUARIO')),
    to_char(now() + interval '4 years', 'MM/YY'),
    lpad(floor(random() * 1000)::int::text, 3, '0'),
    0
  );

  insert into public.bills (user_id, account_id, company_name, category, amount, due_date)
  values
    (new.id, v_account_id, 'Edesur', 'Luz', 15000, current_date + 5),
    (new.id, v_account_id, 'Metrogas', 'Gas', 8000, current_date + 10),
    (new.id, v_account_id, 'Movistar', 'Internet', 12000, current_date - 2);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FUNCIÓN: transferencia atómica
-- ============================================
create or replace function transfer_money(
  origin_account_id uuid,
  destination_alias text,
  transfer_amount numeric,
  transfer_description text default 'Transferencia'
)
returns json as $$
declare
  v_uid uuid := auth.uid();
  v_origin_balance numeric;
  v_dest_id uuid;
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  transfer_amount := round(transfer_amount, 2);
  if transfer_amount is null or transfer_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  transfer_description := left(coalesce(nullif(trim(transfer_description), ''), 'Transferencia'), 80);

  -- Bloquea la fila solo si la cuenta de origen pertenece a quien llama
  select balance into v_origin_balance
  from accounts
  where id = origin_account_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'Cuenta de origen inválida';
  end if;

  select id into v_dest_id
  from accounts
  where alias = lower(trim(destination_alias)) or cbu = trim(destination_alias);

  if v_dest_id is null then
    raise exception 'No se encontró ninguna cuenta con ese alias';
  end if;

  if v_dest_id = origin_account_id then
    raise exception 'No podés transferirte a la misma cuenta';
  end if;

  if v_origin_balance < transfer_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts set balance = balance - transfer_amount where id = origin_account_id;
  update accounts set balance = balance + transfer_amount where id = v_dest_id;

  insert into transactions (account_id, type, amount, description, category)
  values (origin_account_id, 'transfer_out', transfer_amount, transfer_description, 'Transferencia enviada');

  insert into transactions (account_id, type, amount, description, category)
  values (v_dest_id, 'transfer_in', transfer_amount, transfer_description, 'Transferencia recibida');

  return json_build_object('success', true, 'new_balance', v_origin_balance - transfer_amount);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCIÓN: pago de servicios
-- ============================================
create or replace function pay_bill(
  bill_id uuid,
  paying_account_id uuid
)
returns json as $$
declare
  v_uid uuid := auth.uid();
  v_amount numeric;
  v_is_paid boolean;
  v_company text;
  v_category text;
  v_balance numeric;
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  -- Bloquea la factura (evita pagarla dos veces en simultáneo) y exige que sea del usuario
  select amount, is_paid, company_name, category
  into v_amount, v_is_paid, v_company, v_category
  from bills
  where id = bill_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'No se encontró el servicio a pagar';
  end if;

  if v_is_paid then
    raise exception 'Este servicio ya fue pagado';
  end if;

  select balance into v_balance
  from accounts
  where id = paying_account_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'Cuenta de pago inválida';
  end if;

  if v_balance < v_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts set balance = balance - v_amount where id = paying_account_id;
  update bills set is_paid = true, paid_at = now() where id = bill_id;

  insert into transactions (account_id, type, amount, description, category)
  values (paying_account_id, 'expense', v_amount, v_company, v_category);

  return json_build_object('success', true);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCIÓN: plazo fijo (la tasa la fija el servidor)
-- ============================================
create or replace function create_investment(
  investing_account_id uuid,
  investment_amount numeric,
  investment_rate numeric,
  investment_term_days integer
)
returns json as $$
declare
  v_uid uuid := auth.uid();
  v_rate constant numeric := 40;  -- TNA simulada; el parámetro del cliente se ignora
  v_balance numeric;
  v_investment_id uuid;
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  investment_amount := round(investment_amount, 2);
  if investment_amount is null or investment_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if investment_term_days is null or investment_term_days < 1 or investment_term_days > 365 then
    raise exception 'El plazo debe estar entre 1 y 365 días';
  end if;

  select balance into v_balance
  from accounts
  where id = investing_account_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'Cuenta inválida';
  end if;

  if v_balance < investment_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts set balance = balance - investment_amount where id = investing_account_id;

  insert into investments (user_id, account_id, amount, interest_rate, term_days, maturity_date)
  values (v_uid, investing_account_id, investment_amount, v_rate, investment_term_days,
          current_date + investment_term_days)
  returning id into v_investment_id;

  insert into transactions (account_id, type, amount, description, category)
  values (investing_account_id, 'expense', investment_amount, 'Plazo fijo constituido', 'Inversión');

  return json_build_object('success', true, 'investment_id', v_investment_id);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCIÓN: préstamo (tasa y tope los fija el servidor)
-- ============================================
create or replace function request_loan(
  loan_account_id uuid,
  loan_amount numeric,
  loan_rate numeric,
  loan_installments integer
)
returns json as $$
declare
  v_uid uuid := auth.uid();
  v_rate constant numeric := 60;           -- TEA simulada; el parámetro del cliente se ignora
  v_max_amount constant numeric := 1000000; -- tope por préstamo
  v_loan_id uuid;
  v_installment numeric;
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  loan_amount := round(loan_amount, 2);
  if loan_amount is null or loan_amount <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if loan_amount > v_max_amount then
    raise exception 'El monto máximo por préstamo es $1.000.000';
  end if;

  if loan_installments is null or loan_installments < 1 or loan_installments > 60 then
    raise exception 'Las cuotas deben estar entre 1 y 60';
  end if;

  perform 1 from accounts where id = loan_account_id and user_id = v_uid for update;
  if not found then
    raise exception 'Cuenta inválida';
  end if;

  v_installment := round(loan_amount * (1 + v_rate / 100) / loan_installments, 2);

  insert into loans (user_id, account_id, amount, interest_rate, installments, installment_amount)
  values (v_uid, loan_account_id, loan_amount, v_rate, loan_installments, v_installment)
  returning id into v_loan_id;

  update accounts set balance = balance + loan_amount where id = loan_account_id;

  insert into transactions (account_id, type, amount, description, category)
  values (loan_account_id, 'income', loan_amount, 'Préstamo acreditado', 'Préstamo');

  return json_build_object('success', true, 'loan_id', v_loan_id, 'installment_amount', v_installment);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCIÓN: alta de tarjeta (número y CVV los genera el servidor)
-- ============================================
create or replace function create_card(p_card_type text)
returns json as $$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_holder text;
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  if p_card_type not in ('debit', 'credit') then
    raise exception 'Tipo de tarjeta inválido';
  end if;

  select id into v_account_id
  from accounts
  where user_id = v_uid
  order by created_at
  limit 1;

  if v_account_id is null then
    raise exception 'No se encontró una cuenta asociada';
  end if;

  select upper(coalesce(nullif(trim(full_name), ''), 'USUARIO')) into v_holder
  from profiles
  where id = v_uid;

  insert into cards (account_id, user_id, card_type, card_number, card_holder, expiry_date, cvv, credit_limit)
  values (
    v_account_id, v_uid, p_card_type,
    case when p_card_type = 'debit' then '4' else '5' end
      || lpad(floor(random() * 1000000000000000)::bigint::text, 15, '0'),
    coalesce(v_holder, 'USUARIO'),
    to_char(now() + interval '4 years', 'MM/YY'),
    lpad(floor(random() * 1000)::int::text, 3, '0'),
    case when p_card_type = 'credit' then 100000 else 0 end
  );

  return json_build_object('success', true);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCIÓN: agregar un servicio a pagar
-- ============================================
create or replace function create_bill(
  p_company text,
  p_category text,
  p_amount numeric,
  p_due_date date
)
returns json as $$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_company text := trim(p_company);
  v_bill_id uuid;
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  if v_company is null or char_length(v_company) < 2 or char_length(v_company) > 40 then
    raise exception 'El nombre del servicio debe tener entre 2 y 40 caracteres';
  end if;

  if p_category is null or p_category not in
     ('Luz', 'Gas', 'Internet', 'Agua', 'Teléfono', 'Tarjeta', 'Alquiler', 'Seguro', 'Otros') then
    raise exception 'Categoría inválida';
  end if;

  p_amount := round(p_amount, 2);
  if p_amount is null or p_amount <= 0 then
    raise exception 'El importe debe ser mayor a cero';
  end if;

  if p_amount > 10000000 then
    raise exception 'El importe máximo por servicio es $10.000.000';
  end if;

  if p_due_date is null or p_due_date < current_date - 90 or p_due_date > current_date + 365 then
    raise exception 'La fecha de vencimiento no es válida';
  end if;

  if (select count(*) from bills where user_id = v_uid and not is_paid) >= 30 then
    raise exception 'Llegaste al máximo de 30 servicios pendientes';
  end if;

  select id into v_account_id
  from accounts
  where user_id = v_uid
  order by created_at
  limit 1;

  if v_account_id is null then
    raise exception 'No se encontró una cuenta asociada';
  end if;

  insert into bills (user_id, account_id, company_name, category, amount, due_date)
  values (v_uid, v_account_id, v_company, p_category, p_amount, p_due_date)
  returning id into v_bill_id;

  return json_build_object('success', true, 'bill_id', v_bill_id);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- FUNCIÓN: eliminar un servicio pendiente (los pagados quedan como historial)
-- ============================================
create or replace function delete_bill(p_bill_id uuid)
returns json as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sesión no válida';
  end if;

  delete from bills
  where id = p_bill_id and user_id = v_uid and not is_paid;

  if not found then
    raise exception 'No se pudo eliminar el servicio';
  end if;

  return json_build_object('success', true);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================
-- ENDURECIMIENTO: el cliente no puede escribir directamente
-- ============================================
-- Políticas de escritura de versiones anteriores (ya no se usan)
drop policy if exists "Users can insert own accounts" on accounts;
drop policy if exists "Users can update own accounts" on accounts;
drop policy if exists "Users can insert own transactions" on transactions;
drop policy if exists "Users can insert own cards" on cards;
drop policy if exists "Users can insert own bills" on bills;
drop policy if exists "Users can update own bills" on bills;
drop policy if exists "Users can insert own investments" on investments;
drop policy if exists "Users can insert own loans" on loans;

-- Segunda barrera: sin permisos de escritura a nivel de tabla
revoke insert, update, delete on accounts, transactions, bills, investments, loans from anon, authenticated;
revoke insert, update, delete on cards from anon, authenticated;
revoke insert, update, delete on profiles from anon, authenticated;

-- Excepciones puntuales (siempre limitadas a filas propias por RLS)
grant update (is_blocked) on cards to authenticated;                       -- bloquear/desbloquear
grant update (full_name, dni, phone, avatar_url) on profiles to authenticated; -- editar perfil

-- Las funciones solo las puede ejecutar un usuario con sesión
revoke all on function transfer_money(uuid, text, numeric, text) from public, anon;
revoke all on function pay_bill(uuid, uuid) from public, anon;
revoke all on function create_investment(uuid, numeric, numeric, integer) from public, anon;
revoke all on function request_loan(uuid, numeric, numeric, integer) from public, anon;
revoke all on function create_card(text) from public, anon;
grant execute on function transfer_money(uuid, text, numeric, text) to authenticated;
grant execute on function pay_bill(uuid, uuid) to authenticated;
grant execute on function create_investment(uuid, numeric, numeric, integer) to authenticated;
grant execute on function request_loan(uuid, numeric, numeric, integer) to authenticated;
grant execute on function create_card(text) to authenticated;
revoke all on function create_bill(text, text, numeric, date) from public, anon;
revoke all on function delete_bill(uuid) from public, anon;
grant execute on function create_bill(text, text, numeric, date) to authenticated;
grant execute on function delete_bill(uuid) to authenticated;

-- ============================================
-- DATOS: servicios de ejemplo para usuarios existentes sin ninguno
-- ============================================
insert into bills (user_id, account_id, company_name, category, amount, due_date)
select a.user_id, a.id, v.company, v.category, v.amount, current_date + v.days
from accounts a
cross join (values
  ('Edesur', 'Luz', 15000, 5),
  ('Metrogas', 'Gas', 8000, 10),
  ('Movistar', 'Internet', 12000, -2)
) as v(company, category, amount, days)
where not exists (select 1 from bills b where b.user_id = a.user_id);
