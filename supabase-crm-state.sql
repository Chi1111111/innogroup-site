create table if not exists public.crm_state (
  id text primary key,
  payload jsonb not null default '{"leads":[],"orders":[],"loanCars":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_state enable row level security;

drop policy if exists "crm_state_select" on public.crm_state;
drop policy if exists "crm_state_insert" on public.crm_state;
drop policy if exists "crm_state_update" on public.crm_state;

revoke all on public.crm_state from anon, authenticated;
grant all on public.crm_state to service_role;
