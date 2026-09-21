alter table public.japan_photo_settings add column processing_enabled boolean not null default false;
alter table public.japan_photo_jobs add column candidate_verified boolean not null default false;
create table public.japan_photo_vehicles (
 id text primary key, payload jsonb not null, photo_ids text[] not null,
 registered_at timestamptz not null default now(),
 check(cardinality(photo_ids)>0)
);
alter table public.japan_photo_vehicles enable row level security;
revoke all on public.japan_photo_vehicles from anon,authenticated;
grant all on public.japan_photo_vehicles to service_role;
create view public.japan_photo_ready_vehicles with (security_invoker=true) as
 select v.* from public.japan_photo_vehicles v
 where not exists (
 select 1 from unnest(v.photo_ids) expected(id)
 left join public.japan_photo_jobs j on j.id=expected.id
 where j.id is null or j.status<>'approved' or not j.candidate_verified or j.candidate_path is null
 );
revoke all on public.japan_photo_ready_vehicles from anon,authenticated;
grant select on public.japan_photo_ready_vehicles to service_role;
create or replace function public.claim_japan_photo() returns setof public.japan_photo_jobs
language plpgsql security invoker set search_path = '' as $$
declare picked text;
begin
 if not exists(select 1 from public.japan_photo_settings where id=1 and processing_enabled and used_bytes<budget_bytes) then return; end if;
 select id into picked from public.japan_photo_jobs where status='queued' or (status='processing' and lease_until<now()) order by created_at,id for update skip locked limit 1;
 if picked is null then return; end if;
 return query update public.japan_photo_jobs set status='processing',lease=gen_random_uuid(),lease_until=now()+interval '10 minutes',updated_at=now() where id=picked returning *;
end $$;
