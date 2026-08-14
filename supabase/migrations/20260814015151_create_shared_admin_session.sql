create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);

create index if not exists admin_login_attempts_ip_time_idx
on public.admin_login_attempts (ip_hash, attempted_at desc);

create index if not exists admin_login_attempts_time_idx
on public.admin_login_attempts (attempted_at desc);

alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from anon, authenticated;
grant select, insert, delete on public.admin_login_attempts to service_role;

drop policy if exists "admin_login_attempts_deny_browser_access" on public.admin_login_attempts;
create policy "admin_login_attempts_deny_browser_access"
on public.admin_login_attempts as restrictive for all to anon, authenticated
using (false)
with check (false);

alter table public.invoice_email_events
  alter column sent_by drop not null;

alter table public.invoice_email_events
  add column if not exists actor text not null default 'shared-admin';

grant select, insert, update, delete on
  public.contracts,
  public.crm_state,
  public.japan_special_orders_state,
  public.invoices,
  public.invoice_email_events
to service_role;
