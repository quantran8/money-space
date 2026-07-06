create extension if not exists "pgcrypto";

create type public.household_role as enum ('owner', 'partner', 'viewer');
create type public.permission_level as enum (
  'view_summary',
  'view_grouped',
  'view_detail',
  'edit_content',
  'admin'
);
create type public.update_frequency as enum ('weekly', 'monthly', 'manual');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'cancelled');
create type public.snapshot_status as enum ('good', 'attention', 'tight', 'insufficient_data');
create type public.snapshot_source_mode as enum ('manual', 'calculated', 'mixed');
create type public.asset_type as enum (
  'cash',
  'bank_account',
  'saving_deposit',
  'bond',
  'gold',
  'stock',
  'fund',
  'crypto',
  'foreign_currency',
  'real_estate',
  'insurance',
  'loan_receivable',
  'certificate_of_deposit',
  'investment',
  'other'
);
create type public.asset_valuation_mode as enum ('manual', 'market_priced', 'formula_calculated');
create type public.asset_liquidity as enum ('usable_now', 'not_immediately_usable', 'long_term');
create type public.visibility_level as enum ('summary_only', 'grouped', 'detail', 'private');
create type public.asset_class as enum ('gold', 'crypto', 'stock', 'fund', 'foreign_currency');
create type public.asset_calculation_type as enum (
  'saving_deposit',
  'bond',
  'loan_receivable',
  'certificate_of_deposit',
  'custom_interest'
);
create type public.interest_rate_type as enum ('fixed', 'floating');
create type public.compounding_frequency as enum (
  'none',
  'daily',
  'monthly',
  'quarterly',
  'yearly',
  'at_maturity'
);
create type public.payout_frequency as enum ('at_maturity', 'monthly', 'quarterly', 'yearly');
create type public.asset_calculation_status as enum ('active', 'matured', 'closed', 'cancelled');
create type public.asset_valuation_method as enum (
  'manual',
  'market_price_api',
  'formula_calculated',
  'statement',
  'appraised',
  'other'
);
create type public.confidence_level as enum ('low', 'medium', 'high');
create type public.payment_frequency as enum ('once', 'weekly', 'monthly', 'quarterly', 'yearly');
create type public.payment_status as enum ('unpaid', 'paid', 'pending_confirmation', 'postponed', 'overdue');
create type public.attention_level as enum ('normal', 'important', 'urgent');
create type public.money_event_type as enum (
  'expense',
  'income',
  'transfer',
  'asset_purchase',
  'asset_sale',
  'asset_update',
  'payment_paid',
  'goal_contribution',
  'debt_update',
  'adjustment',
  'other'
);
create type public.money_event_category as enum (
  'housing',
  'education',
  'transport',
  'health',
  'family_support',
  'insurance',
  'saving',
  'investment',
  'debt',
  'income',
  'repair',
  'household',
  'children',
  'travel',
  'other'
);
create type public.money_direction as enum ('inflow', 'outflow', 'neutral');
create type public.money_event_status as enum ('recorded', 'pending_confirmation', 'cancelled');
create type public.goal_category as enum (
  'emergency_fund',
  'home',
  'home_repair',
  'children',
  'travel',
  'debt_repayment',
  'investment',
  'education',
  'other'
);
create type public.goal_priority as enum ('low', 'medium', 'high');
create type public.goal_status as enum ('active', 'paused', 'completed', 'cancelled');
create type public.related_object_type as enum (
  'asset',
  'upcoming_payment',
  'financial_goal',
  'snapshot',
  'money_event'
);
create type public.attention_item_status as enum ('open', 'seen', 'resolved', 'dismissed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name <> ''),
  currency text not null default 'VND' check (currency <> ''),
  update_frequency public.update_frequency not null default 'weekly',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.household_role not null default 'partner',
  permission_level public.permission_level not null default 'view_detail',
  joined_at timestamptz not null default timezone('utc', now()),
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint household_members_unique unique (household_id, user_id)
);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  invited_by uuid not null references public.profiles (id),
  invitee_email text,
  invitee_phone text,
  token text not null unique,
  status public.invite_status not null default 'pending',
  default_role public.household_role not null default 'partner',
  default_permission_level public.permission_level not null default 'view_detail',
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint household_invites_contact_check check (
    invitee_email is not null or invitee_phone is not null
  )
);

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  snapshot_date date not null default current_date,
  total_liquid numeric(14, 2) not null default 0 check (total_liquid >= 0),
  total_savings numeric(14, 2) not null default 0 check (total_savings >= 0),
  total_long_term_assets numeric(14, 2) not null default 0 check (total_long_term_assets >= 0),
  total_debt numeric(14, 2) not null default 0 check (total_debt >= 0),
  upcoming_due_amount numeric(14, 2) not null default 0 check (upcoming_due_amount >= 0),
  attention_count integer not null default 0 check (attention_count >= 0),
  status public.snapshot_status not null default 'insufficient_data',
  source_mode public.snapshot_source_mode not null default 'manual',
  note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (name <> ''),
  type public.asset_type not null,
  valuation_mode public.asset_valuation_mode not null default 'manual',
  current_value numeric(14, 2) not null default 0 check (current_value >= 0),
  currency text not null default 'VND' check (currency <> ''),
  value_updated_at timestamptz,
  holder_member_id uuid references public.household_members (id),
  liquidity public.asset_liquidity not null default 'usable_now',
  purpose text,
  visibility_level public.visibility_level not null default 'detail',
  note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.asset_market_positions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  symbol text,
  market text,
  asset_class public.asset_class not null,
  quantity numeric(20, 8) not null check (quantity >= 0),
  unit text,
  quote_currency text not null check (quote_currency <> ''),
  price_source text,
  price_source_symbol text,
  last_price numeric(20, 8) check (last_price >= 0),
  last_price_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.market_prices (
  id uuid primary key default gen_random_uuid(),
  asset_class public.asset_class not null,
  symbol text not null check (symbol <> ''),
  market text,
  quote_currency text not null check (quote_currency <> ''),
  price numeric(20, 8) not null check (price >= 0),
  price_time timestamptz not null,
  source text not null check (source <> ''),
  source_payload_hash text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null check (base_currency <> ''),
  quote_currency text not null check (quote_currency <> ''),
  rate numeric(20, 8) not null check (rate > 0),
  rate_time timestamptz not null,
  source text not null check (source <> ''),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.asset_calculation_terms (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  calculation_type public.asset_calculation_type not null,
  principal_amount numeric(14, 2) not null check (principal_amount >= 0),
  currency text not null default 'VND' check (currency <> ''),
  start_date date not null,
  maturity_date date,
  interest_rate numeric(8, 4) check (interest_rate >= 0),
  interest_rate_type public.interest_rate_type,
  compounding_frequency public.compounding_frequency,
  payout_frequency public.payout_frequency,
  coupon_rate numeric(8, 4) check (coupon_rate >= 0),
  coupon_frequency public.payout_frequency,
  expected_return_rate numeric(8, 4) check (expected_return_rate >= 0),
  status public.asset_calculation_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.asset_valuations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  value numeric(14, 2) not null check (value >= 0),
  currency text not null default 'VND' check (currency <> ''),
  valuation_date date not null,
  valuation_method public.asset_valuation_method not null,
  source text,
  confidence_level public.confidence_level,
  market_price_id uuid references public.market_prices (id),
  fx_rate_id uuid references public.fx_rates (id),
  calculation_term_id uuid references public.asset_calculation_terms (id),
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.snapshot_asset_values (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  snapshot_id uuid not null references public.snapshots (id) on delete cascade,
  asset_id uuid not null references public.assets (id),
  asset_name text not null,
  asset_type public.asset_type not null,
  liquidity public.asset_liquidity not null,
  value numeric(14, 2) not null check (value >= 0),
  currency text not null default 'VND' check (currency <> ''),
  valuation_id uuid references public.asset_valuations (id),
  valuation_method public.asset_valuation_method,
  valuation_date date,
  visibility_level public.visibility_level not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint snapshot_asset_values_unique unique (snapshot_id, asset_id)
);

create table public.upcoming_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (name <> ''),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  due_date date not null,
  frequency public.payment_frequency not null default 'once',
  auto_create_next boolean not null default false,
  owner_member_id uuid references public.household_members (id),
  status public.payment_status not null default 'unpaid',
  attention_level public.attention_level not null default 'normal',
  is_attention_needed boolean not null default false,
  note text,
  paid_at timestamptz,
  paid_by uuid references public.profiles (id),
  paid_amount numeric(14, 2) check (paid_amount >= 0),
  paid_from_asset_id uuid references public.assets (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (name <> ''),
  category public.goal_category not null default 'other',
  target_amount numeric(14, 2) not null default 0 check (target_amount >= 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  priority public.goal_priority not null default 'medium',
  status public.goal_status not null default 'active',
  linked_asset_id uuid references public.assets (id),
  note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.money_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (title <> ''),
  description text,
  event_type public.money_event_type not null,
  category public.money_event_category not null default 'other',
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  currency text not null default 'VND' check (currency <> ''),
  event_date date not null,
  direction public.money_direction not null,
  from_asset_id uuid references public.assets (id),
  to_asset_id uuid references public.assets (id),
  upcoming_payment_id uuid references public.upcoming_payments (id),
  financial_goal_id uuid references public.financial_goals (id),
  snapshot_id uuid references public.snapshots (id),
  is_large_event boolean not null default false,
  is_attention_needed boolean not null default false,
  visibility_level public.visibility_level not null default 'detail',
  status public.money_event_status not null default 'recorded',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (title <> ''),
  reason text,
  amount numeric(14, 2) check (amount >= 0),
  related_object_type public.related_object_type,
  related_object_id uuid,
  level public.attention_level not null default 'normal',
  status public.attention_item_status not null default 'open',
  visibility_level public.visibility_level not null default 'detail',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  seen_by uuid references public.profiles (id),
  seen_at timestamptz,
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  deleted_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  actor_id uuid not null references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_household(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.permission_level in ('edit_content', 'admin')
  );
$$;

create index household_members_user_id_idx on public.household_members (user_id);
create index household_members_household_user_idx on public.household_members (household_id, user_id);
create index household_invites_household_status_idx on public.household_invites (household_id, status);
create index snapshots_household_snapshot_date_idx on public.snapshots (household_id, snapshot_date desc);
create index snapshots_household_created_at_idx on public.snapshots (household_id, created_at desc);
create index assets_household_id_idx on public.assets (household_id) where deleted_at is null;
create index assets_household_type_idx on public.assets (household_id, type) where deleted_at is null;
create index assets_household_liquidity_idx on public.assets (household_id, liquidity) where deleted_at is null;
create index assets_household_valuation_mode_idx on public.assets (household_id, valuation_mode) where deleted_at is null;
create index asset_market_positions_household_asset_idx
  on public.asset_market_positions (household_id, asset_id)
  where deleted_at is null;
create index asset_market_positions_lookup_idx
  on public.asset_market_positions (asset_class, symbol, market)
  where deleted_at is null;
create index market_prices_lookup_idx
  on public.market_prices (asset_class, symbol, market, quote_currency, price_time desc);
create index fx_rates_lookup_idx
  on public.fx_rates (base_currency, quote_currency, rate_time desc);
create index asset_calculation_terms_household_asset_idx
  on public.asset_calculation_terms (household_id, asset_id)
  where deleted_at is null;
create index asset_calculation_terms_type_status_idx
  on public.asset_calculation_terms (calculation_type, status)
  where deleted_at is null;
create index asset_valuations_household_asset_date_idx
  on public.asset_valuations (household_id, asset_id, valuation_date desc)
  where deleted_at is null;
create index asset_valuations_asset_date_idx
  on public.asset_valuations (asset_id, valuation_date desc)
  where deleted_at is null;
create unique index asset_valuations_asset_date_unique_idx
  on public.asset_valuations (asset_id, valuation_date)
  where deleted_at is null;
create index snapshot_asset_values_snapshot_idx on public.snapshot_asset_values (snapshot_id);
create index snapshot_asset_values_household_snapshot_idx
  on public.snapshot_asset_values (household_id, snapshot_id);
create index snapshot_asset_values_asset_idx on public.snapshot_asset_values (asset_id);
create index upcoming_payments_household_due_date_idx
  on public.upcoming_payments (household_id, due_date)
  where deleted_at is null;
create index upcoming_payments_household_status_idx
  on public.upcoming_payments (household_id, status)
  where deleted_at is null;
create index upcoming_payments_household_attention_idx
  on public.upcoming_payments (household_id, is_attention_needed)
  where deleted_at is null;
create index financial_goals_household_status_idx
  on public.financial_goals (household_id, status)
  where deleted_at is null;
create index money_events_household_event_date_idx
  on public.money_events (household_id, event_date desc)
  where deleted_at is null;
create index money_events_household_event_type_idx
  on public.money_events (household_id, event_type)
  where deleted_at is null;
create index money_events_household_attention_idx
  on public.money_events (household_id, is_attention_needed)
  where deleted_at is null;
create index money_events_from_asset_idx on public.money_events (from_asset_id) where deleted_at is null;
create index money_events_to_asset_idx on public.money_events (to_asset_id) where deleted_at is null;
create index attention_items_household_status_idx
  on public.attention_items (household_id, status)
  where deleted_at is null;
create index attention_items_household_level_idx
  on public.attention_items (household_id, level)
  where deleted_at is null;
create index audit_logs_household_created_at_idx on public.audit_logs (household_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create trigger household_members_set_updated_at
before update on public.household_members
for each row execute function public.set_updated_at();

create trigger household_invites_set_updated_at
before update on public.household_invites
for each row execute function public.set_updated_at();

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create trigger asset_market_positions_set_updated_at
before update on public.asset_market_positions
for each row execute function public.set_updated_at();

create trigger asset_calculation_terms_set_updated_at
before update on public.asset_calculation_terms
for each row execute function public.set_updated_at();

create trigger asset_valuations_set_updated_at
before update on public.asset_valuations
for each row execute function public.set_updated_at();

create trigger upcoming_payments_set_updated_at
before update on public.upcoming_payments
for each row execute function public.set_updated_at();

create trigger financial_goals_set_updated_at
before update on public.financial_goals
for each row execute function public.set_updated_at();

create trigger money_events_set_updated_at
before update on public.money_events
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.snapshots enable row level security;
alter table public.assets enable row level security;
alter table public.asset_market_positions enable row level security;
alter table public.market_prices enable row level security;
alter table public.fx_rates enable row level security;
alter table public.asset_calculation_terms enable row level security;
alter table public.asset_valuations enable row level security;
alter table public.snapshot_asset_values enable row level security;
alter table public.upcoming_payments enable row level security;
alter table public.financial_goals enable row level security;
alter table public.money_events enable row level security;
alter table public.attention_items enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id);

create policy "households visible to members"
on public.households
for select
using (public.is_household_member(id));

create policy "households insertable by authenticated users"
on public.households
for insert
with check (auth.uid() = created_by);

create policy "households editable by admins"
on public.households
for update
using (public.can_edit_household(id));

create policy "household_members visible to household members"
on public.household_members
for select
using (public.is_household_member(household_id));

create policy "household_members managed by admins"
on public.household_members
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "household_invites visible to household members"
on public.household_invites
for select
using (public.is_household_member(household_id));

create policy "household_invites managed by admins"
on public.household_invites
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "snapshots visible to household members"
on public.snapshots
for select
using (public.is_household_member(household_id));

create policy "snapshots editable by editors"
on public.snapshots
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "assets visible to household members"
on public.assets
for select
using (public.is_household_member(household_id));

create policy "assets editable by editors"
on public.assets
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "asset market positions visible to household members"
on public.asset_market_positions
for select
using (public.is_household_member(household_id));

create policy "asset market positions editable by editors"
on public.asset_market_positions
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "market prices readable by authenticated users"
on public.market_prices
for select
using (auth.role() = 'authenticated');

create policy "market prices insertable by authenticated users"
on public.market_prices
for insert
with check (auth.role() = 'authenticated');

create policy "fx rates readable by authenticated users"
on public.fx_rates
for select
using (auth.role() = 'authenticated');

create policy "fx rates insertable by authenticated users"
on public.fx_rates
for insert
with check (auth.role() = 'authenticated');

create policy "asset calculation terms visible to household members"
on public.asset_calculation_terms
for select
using (public.is_household_member(household_id));

create policy "asset calculation terms editable by editors"
on public.asset_calculation_terms
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "asset valuations visible to household members"
on public.asset_valuations
for select
using (public.is_household_member(household_id));

create policy "asset valuations editable by editors"
on public.asset_valuations
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "snapshot asset values visible to household members"
on public.snapshot_asset_values
for select
using (public.is_household_member(household_id));

create policy "snapshot asset values editable by editors"
on public.snapshot_asset_values
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "upcoming_payments visible to household members"
on public.upcoming_payments
for select
using (public.is_household_member(household_id));

create policy "upcoming_payments editable by editors"
on public.upcoming_payments
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "financial_goals visible to household members"
on public.financial_goals
for select
using (public.is_household_member(household_id));

create policy "financial_goals editable by editors"
on public.financial_goals
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "money_events visible to household members"
on public.money_events
for select
using (public.is_household_member(household_id));

create policy "money_events editable by editors"
on public.money_events
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "attention_items visible to household members"
on public.attention_items
for select
using (public.is_household_member(household_id));

create policy "attention_items editable by editors"
on public.attention_items
for all
using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

create policy "audit_logs visible to household members"
on public.audit_logs
for select
using (public.is_household_member(household_id));

create policy "audit_logs insertable by editors"
on public.audit_logs
for insert
with check (public.can_edit_household(household_id) and actor_id = auth.uid());
