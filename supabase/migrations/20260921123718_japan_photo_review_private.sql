create table public.japan_photo_settings (
  id integer primary key check (id = 1), key_hash text,
  budget_bytes bigint not null default 250000000 check (budget_bytes > 0),
  used_bytes bigint not null default 0 check (used_bytes >= 0)
);
insert into public.japan_photo_settings(id) values(1);
create table public.japan_photo_jobs (
  id text primary key check (id ~ '^[a-f0-9]{64}$'), url text not null unique, vehicle text not null default '',
  status text not null default 'queued' check (status in ('queued','processing','pending_review','needs_inspection','approved','rejected','failed','capacity_blocked')),
  original_path text, candidate_path text, original_bytes bigint not null default 0, candidate_bytes bigint not null default 0,
  detection jsonb not null default '{}', error text, lease uuid, lease_until timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index japan_photo_jobs_queue on public.japan_photo_jobs(status,created_at);
create table public.japan_photo_decisions (
  id bigint generated always as identity primary key,
  photo_id text not null references public.japan_photo_jobs(id), decision text not null,
  created_at timestamptz not null default now()
);
alter table public.japan_photo_settings enable row level security;
alter table public.japan_photo_jobs enable row level security;
alter table public.japan_photo_decisions enable row level security;
revoke all on public.japan_photo_settings, public.japan_photo_jobs, public.japan_photo_decisions from anon, authenticated;
grant all on public.japan_photo_settings, public.japan_photo_jobs, public.japan_photo_decisions to service_role;
grant usage,select on sequence public.japan_photo_decisions_id_seq to service_role;

create function public.claim_japan_photo() returns setof public.japan_photo_jobs
language plpgsql security invoker set search_path = '' as $$
declare picked text;
begin
  if not exists(select 1 from public.japan_photo_settings where id=1 and used_bytes < budget_bytes) then return; end if;
  select id into picked from public.japan_photo_jobs
    where status='queued' or (status='processing' and lease_until < now())
    order by created_at for update skip locked limit 1;
  if picked is null then return; end if;
  return query update public.japan_photo_jobs set status='processing',lease=gen_random_uuid(),lease_until=now()+interval '10 minutes',updated_at=now()
    where id=picked returning *;
end $$;

create function public.reserve_japan_photo_bytes(photo_id text, photo_lease uuid, kind text, byte_count bigint) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare previous bigint; additional bigint;
begin
  if kind not in ('original','candidate') or byte_count < 1 or byte_count > 10000000 then raise exception 'Invalid upload size or kind'; end if;
  perform id from public.japan_photo_settings where id=1 for update;
  select case when kind='original' then original_bytes else candidate_bytes end into previous
    from public.japan_photo_jobs where id=photo_id and lease=photo_lease and status='processing' and lease_until>now() for update;
  if previous is null then raise exception 'Expired photo lease'; end if;
  additional := greatest(0,byte_count-previous);
  if exists(select 1 from public.japan_photo_settings where id=1 and used_bytes+additional>budget_bytes) then return false; end if;
  update public.japan_photo_settings set used_bytes=used_bytes+additional where id=1;
  update public.japan_photo_jobs set original_bytes=case when kind='original' then greatest(original_bytes,byte_count) else original_bytes end,
    candidate_bytes=case when kind='candidate' then greatest(candidate_bytes,byte_count) else candidate_bytes end where id=photo_id;
  return true;
end $$;

create function public.japan_photo_counts() returns jsonb language sql security invoker set search_path = '' as $$
  select coalesce(jsonb_object_agg(status,n),'{}') from (select status,count(*) n from public.japan_photo_jobs group by status) counts
$$;
create function public.decide_japan_photo(photo_id text, decision text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  update public.japan_photo_jobs set status=decision,updated_at=now()
    where id=photo_id and status in ('pending_review','needs_inspection','approved','rejected') and (decision='rejected' or candidate_path is not null);
  if not found then raise exception 'Photo has no reviewable candidate'; end if;
  insert into public.japan_photo_decisions(photo_id,decision) values(photo_id,decision);
end $$;
revoke all on function public.claim_japan_photo(), public.reserve_japan_photo_bytes(text,uuid,text,bigint), public.japan_photo_counts(), public.decide_japan_photo(text,text) from public,anon,authenticated;
grant execute on function public.claim_japan_photo(), public.reserve_japan_photo_bytes(text,uuid,text,bigint), public.japan_photo_counts(), public.decide_japan_photo(text,text) to service_role;
