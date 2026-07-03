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

create policy "crm_state_select"
on public.crm_state
for select
to anon
using (true);

create policy "crm_state_insert"
on public.crm_state
for insert
to anon
with check (id = 'main');

create policy "crm_state_update"
on public.crm_state
for update
to anon
using (id = 'main')
with check (id = 'main');

grant select, insert, update on public.crm_state to anon;
