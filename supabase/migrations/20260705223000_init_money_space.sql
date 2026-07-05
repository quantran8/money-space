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
create type public.asset_type as enum (
  'cash',
  'bank_account',
  'saving',
  'gold',
  'real_estate',
  'investment',
  'insurance',
  'loan_receivable',
  'other'
);
create type public.asset_liquidity as enum ('usable_now', 'not_immediately_usable', 'long_term');
create type public.visibility_level as enum ('summary_only', 'grouped', 'detail', 'private');
create type public.payment_frequency as enum ('once', 'weekly', 'monthly', 'quarterly', 'yearly');
create type public.payment_status as enum ('unpaid', 'paid', 'pending_confirmation', 'postponed', 'overdue');
create type public.attention_level as enum ('normal', 'important', 'urgent');
create type public.money_event_type as enum (
  'expense',
  'income',
  'transfer',
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
  'attention_item',
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
  name text not null,
  currency text not null default 'VND',
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
  total_liquid numeric(14, 2) not null default 0,
  total_savings numeric(14, 2) not null default 0,
  total_long_term_assets numeric(14, 2) not null default 0,
  total_debt numeric(14, 2) not null default 0,
  upcoming_due_amount numeric(14, 2) not null default 0,
  attention_count integer not null default 0,
  status public.snapshot_status not null default 'insufficient_data',
  note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  type public.asset_type not null,
  value numeric(14, 2) not null default 0,
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

create table public.upcoming_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null default 0,
  due_date date not null,
  frequency public.payment_frequency not null default 'once',
  owner_member_id uuid references public.household_members (id),
  status public.payment_status not null default 'unpaid',
  attention_level public.attention_level not null default 'normal',
  is_attention_needed boolean not null default false,
  note text,
  paid_at timestamptz,
  paid_by uuid references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  category public.goal_category not null default 'other',
  target_amount numeric(14, 2) not null default 0,
  current_amount numeric(14, 2) not null default 0,
  deadline date,
  priority public.goal_priority not null default 'medium',
  status public.goal_status not null default 'active',
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
  title text not null,
  description text,
  event_type public.money_event_type not null,
  category public.money_event_category not null default 'other',
  amount numeric(14, 2) not null default 0,
  currency text not null default 'VND',
  event_date date not null,
  direction public.money_direction not null default 'neutral',
  related_object_type public.related_object_type,
  related_object_id uuid,
  asset_id uuid references public.assets (id),
  upcoming_payment_id uuid references public.upcoming_payments (id),
  financial_goal_id uuid references public.financial_goals (id),
  snapshot_id uuid references public.snapshots (id),
  is_large_event boolean not null default false,
  is_attention_needed boolean not null default false,
  visibility_level public.visibility_level not null default 'detail',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  reason text not null,
  amount numeric(14, 2),
  related_object_type public.related_object_type,
  related_object_id uuid,
  level public.attention_level not null default 'normal',
  status public.attention_item_status not null default 'open',
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
create index snapshots_household_id_created_at_idx on public.snapshots (household_id, created_at desc);
create index assets_household_id_idx on public.assets (household_id) where deleted_at is null;
create index upcoming_payments_household_due_date_idx
  on public.upcoming_payments (household_id, due_date)
  where deleted_at is null;
create index financial_goals_household_id_idx
  on public.financial_goals (household_id)
  where deleted_at is null;
create index money_events_household_event_date_idx
  on public.money_events (household_id, event_date desc)
  where deleted_at is null;
create index attention_items_household_status_idx
  on public.attention_items (household_id, status)
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
