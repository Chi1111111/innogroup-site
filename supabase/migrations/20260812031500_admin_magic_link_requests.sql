create table if not exists public.admin_magic_link_requests (
  id uuid primary key default gen_random_uuid(),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  ip_hash text not null,
  redirect_to text not null,
  status text not null check (status in ('generating', 'sent', 'failed')),
  provider_email_id text
);

create index if not exists admin_magic_link_requests_ip_time_idx
  on public.admin_magic_link_requests (ip_hash, requested_at desc);

create index if not exists admin_magic_link_requests_time_idx
  on public.admin_magic_link_requests (requested_at desc);

alter table public.admin_magic_link_requests enable row level security;
revoke all on public.admin_magic_link_requests from anon, authenticated;
grant select, insert, update, delete on public.admin_magic_link_requests to service_role;
