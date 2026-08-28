create table if not exists public.japan_market_vehicles (
  id text primary key,
  source text not null,
  source_id text not null,
  make text not null,
  model text not null,
  variant text,
  year smallint,
  mileage integer,
  fuel_type text,
  engine text,
  transmission text,
  drive_type text,
  colour text,
  auction_grade text,
  interior_grade text,
  chassis_code text,
  japan_price integer,
  estimated_nzd_price integer,
  image_urls text[] not null default '{}',
  body_type text,
  location text,
  status text not null default 'Available'
    check (status in ('Available', 'Unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists japan_market_vehicles_public_browse_idx
  on public.japan_market_vehicles (status, make, model, year desc);

create index if not exists japan_market_vehicles_price_idx
  on public.japan_market_vehicles (status, estimated_nzd_price)
  where estimated_nzd_price is not null;

create index if not exists japan_market_vehicles_last_seen_idx
  on public.japan_market_vehicles (source, status, last_seen_at);

alter table public.japan_market_vehicles enable row level security;

drop policy if exists "Public can browse available Japan Market vehicles"
  on public.japan_market_vehicles;

create policy "Public can browse available Japan Market vehicles"
  on public.japan_market_vehicles
  for select
  to anon, authenticated
  using (status = 'Available');

revoke all on public.japan_market_vehicles from anon, authenticated;

grant select (
  id,
  make,
  model,
  variant,
  year,
  mileage,
  fuel_type,
  engine,
  transmission,
  drive_type,
  colour,
  auction_grade,
  interior_grade,
  chassis_code,
  estimated_nzd_price,
  image_urls,
  body_type,
  location,
  status,
  updated_at,
  last_seen_at
) on public.japan_market_vehicles to anon, authenticated;

grant all on public.japan_market_vehicles to service_role;

create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_kind text not null
    check (request_kind in ('vehicle_enquiry', 'sourcing_request')),
  name text not null,
  phone text,
  email text,
  preferred_contact text not null,
  vehicle_id text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year smallint,
  estimated_price integer,
  message text not null,
  contact text not null default '',
  channel text not null default 'Website · Japan Market',
  interest text not null default '',
  budget text not null default '',
  status text not null default '了解',
  next_follow_up date,
  notes text not null default '',
  source_page text,
  ip_hash text,
  user_agent text,
  synced_to_crm_at timestamptz
);

create index if not exists website_leads_created_idx
  on public.website_leads (created_at desc);

create index if not exists website_leads_status_created_idx
  on public.website_leads (status, created_at desc);

create index if not exists website_leads_vehicle_idx
  on public.website_leads (vehicle_id)
  where vehicle_id is not null;

create index if not exists website_leads_rate_limit_idx
  on public.website_leads (ip_hash, created_at desc)
  where ip_hash is not null;

alter table public.website_leads enable row level security;

revoke all on public.website_leads from anon, authenticated;
grant all on public.website_leads to service_role;

-- CRM access is mediated by the authenticated admin Edge Function. Remove the
-- legacy anonymous policies so public website clients cannot read or overwrite
-- the complete CRM JSON document through the Data API.
drop policy if exists "crm_state_select" on public.crm_state;
drop policy if exists "crm_state_insert" on public.crm_state;
drop policy if exists "crm_state_update" on public.crm_state;
revoke all on public.crm_state from anon, authenticated;
grant all on public.crm_state to service_role;
