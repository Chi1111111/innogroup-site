-- Cloud storage and email audit trail for /admin/invoices.
-- Browser access stays protected by RLS. The custom Admin API uses the service role server-side.
create table if not exists public.invoices (
  id text primary key,
  invoice_no text not null unique,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'void')),
  customer_name text,
  customer_email text,
  source_contract_id text,
  total_nzd numeric(14, 2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  issued_at timestamptz,
  paid_at timestamptz,
  last_sent_at timestamptz,
  last_sent_to text,
  send_count integer not null default 0 check (send_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices add column if not exists last_sent_at timestamptz;
alter table public.invoices add column if not exists last_sent_to text;
alter table public.invoices add column if not exists send_count integer not null default 0;

create index if not exists invoices_status_created_at_idx
on public.invoices (status, created_at desc);

create index if not exists invoices_source_contract_id_idx
on public.invoices (source_contract_id);

alter table public.invoices enable row level security;

drop policy if exists "invoices_select" on public.invoices;
drop policy if exists "invoices_insert" on public.invoices;
drop policy if exists "invoices_update" on public.invoices;
drop policy if exists "invoices_delete" on public.invoices;
create policy "invoices_select"
on public.invoices for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "invoices_insert"
on public.invoices for insert to authenticated
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and char_length(invoice_no) between 1 and 80
);

create policy "invoices_update"
on public.invoices for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and char_length(invoice_no) between 1 and 80
);

create policy "invoices_delete"
on public.invoices for delete to authenticated
using (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and status = 'draft'
);

grant select, insert, update, delete on public.invoices to authenticated;

create table if not exists public.invoice_email_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null references public.invoices(id) on delete cascade,
  request_id uuid not null unique,
  recipient text not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  provider_email_id text,
  provider_error text,
  sent_by uuid not null references auth.users(id) on delete restrict,
  send_count_after integer,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  completed_at timestamptz
);

create index if not exists invoice_email_events_invoice_created_idx
on public.invoice_email_events (invoice_id, created_at desc);

create index if not exists invoice_email_events_sender_created_idx
on public.invoice_email_events (sent_by, created_at desc);

alter table public.invoice_email_events enable row level security;

drop policy if exists "invoice_email_events_select" on public.invoice_email_events;
drop policy if exists "invoice_email_events_insert" on public.invoice_email_events;
drop policy if exists "invoice_email_events_update" on public.invoice_email_events;
create policy "invoice_email_events_select"
on public.invoice_email_events for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "invoice_email_events_insert"
on public.invoice_email_events for insert to authenticated
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and sent_by = (select auth.uid())
  and char_length(recipient) between 3 and 320
);

create policy "invoice_email_events_update"
on public.invoice_email_events for update to authenticated
using (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and sent_by = (select auth.uid())
)
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and sent_by = (select auth.uid())
);

grant select, insert, update on public.invoice_email_events to authenticated;
