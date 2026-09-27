create table public.japan_collector_live (
  id integer primary key check (id = 1),
  received_at timestamptz not null default now(),
  snapshot jsonb not null
);
alter table public.japan_collector_live enable row level security;
revoke all on public.japan_collector_live from public, anon, authenticated;
grant select, insert, update on public.japan_collector_live to service_role;
