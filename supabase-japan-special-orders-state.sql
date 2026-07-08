create table if not exists public.japan_special_orders_state (
  id text primary key,
  payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.japan_special_orders_state enable row level security;

drop policy if exists "japan_special_orders_state_select" on public.japan_special_orders_state;
drop policy if exists "japan_special_orders_state_insert" on public.japan_special_orders_state;
drop policy if exists "japan_special_orders_state_update" on public.japan_special_orders_state;

create policy "japan_special_orders_state_select"
on public.japan_special_orders_state
for select
to anon
using (true);

create policy "japan_special_orders_state_insert"
on public.japan_special_orders_state
for insert
to anon
with check (id = 'main');

create policy "japan_special_orders_state_update"
on public.japan_special_orders_state
for update
to anon
using (id = 'main')
with check (id = 'main');

grant select, insert, update on public.japan_special_orders_state to anon;
