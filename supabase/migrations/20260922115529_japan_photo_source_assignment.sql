alter table public.japan_photo_settings add column mac_worker_enabled boolean not null default false;
alter table public.japan_photo_settings add column windows_seen_at timestamptz;
alter table public.japan_photo_settings add column mac_seen_at timestamptz;
alter table public.japan_photo_jobs add column worker_source_group text;

create index japan_photo_jobs_source_queue_idx on public.japan_photo_jobs
  ((split_part(url,'/',3)), created_at) where status in ('queued','processing');

create function public.claim_japan_photo_for_source(source_group text)
returns setof public.japan_photo_jobs language plpgsql security invoker set search_path = '' as $$
declare picked text; split_enabled boolean; enabled boolean; remaining boolean;
begin
  if source_group not in ('windows','mac') or source_group is null then raise exception 'Invalid source group'; end if;
  -- Serialize the handover with claims, without locking during any network work.
  select mac_worker_enabled,processing_enabled,used_bytes<budget_bytes
    into split_enabled,enabled,remaining from public.japan_photo_settings where id=1 for update;
  update public.japan_photo_settings set worker_seen_at=now(),
    windows_seen_at=case when source_group='windows' then now() else windows_seen_at end,
    mac_seen_at=case when source_group='mac' then now() else mac_seen_at end,
    mac_worker_enabled=mac_worker_enabled or source_group='mac' where id=1;
  if not enabled or not remaining then return; end if;
  if source_group='mac' then
    -- Drain Windows' pre-handover Japan Cars jobs, including older worker versions.
    if exists(select 1 from public.japan_photo_jobs where status='processing' and lease_until>now()
      and split_part(url,'/',3)='www.japancars.co.jp' and worker_source_group is distinct from 'mac') then return; end if;
  end if;
  select id into picked from public.japan_photo_jobs
    where (status='queued' or (status='processing' and lease_until<now()))
    and (case when source_group='mac' then split_part(url,'/',3)='www.japancars.co.jp'
              when split_enabled then split_part(url,'/',3) in ('www.919919.jp','vimg.gabs.biz','site.gabs.biz','bidimg.gabs.biz')
              else true end)
    order by created_at,id for update skip locked limit 1;
  if picked is null then return; end if;
  return query update public.japan_photo_jobs set status='processing',lease=gen_random_uuid(),
    lease_until=now()+interval '10 minutes',updated_at=now(),worker_source_group=source_group
    where id=picked returning *;
end $$;
revoke all on function public.claim_japan_photo_for_source(text) from public,anon,authenticated;
grant execute on function public.claim_japan_photo_for_source(text) to service_role;
