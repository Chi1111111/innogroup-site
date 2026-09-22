alter table public.japan_photo_settings add column windows_runtime jsonb not null default '{}';
alter table public.japan_photo_settings add column mac_runtime jsonb not null default '{}';
alter table public.japan_photo_settings add column pause_details jsonb;
create table public.japan_photo_errors (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now(),
 worker_source_group text,
 photo_id text,
 vehicle text,
 source_host text,
 stage text not null,
 message text not null,
 http_status integer
);
alter table public.japan_photo_errors enable row level security;
revoke all on public.japan_photo_errors from public,anon,authenticated;
grant select,insert on public.japan_photo_errors to service_role;
grant usage,select on sequence public.japan_photo_errors_id_seq to service_role;
create index japan_photo_errors_recent_idx on public.japan_photo_errors(created_at desc);
create function public.japan_photo_worker_totals() returns jsonb
language sql security invoker set search_path='' as $$
 select coalesce(jsonb_agg(t),'[]'::jsonb) from (
   select worker_source_group as worker,
     count(*) filter(where status in ('approved','pending_review','needs_inspection','rejected')) as completed,
     count(*) filter(where status='failed') as failed,
     count(*) filter(where status='processing' and lease_until>now()) as processing,
     count(*) filter(where status='processing' and lease_until<=now()) as interrupted,
     max(updated_at) filter(where status in ('approved','pending_review','needs_inspection','rejected')) as last_completed_at
   from public.japan_photo_jobs group by worker_source_group
 ) t;
$$;
revoke all on function public.japan_photo_worker_totals() from public,anon,authenticated;
grant execute on function public.japan_photo_worker_totals() to service_role;
