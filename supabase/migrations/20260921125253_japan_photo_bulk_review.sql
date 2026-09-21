create function public.decide_japan_photos(photo_ids text[], decision text) returns integer
language plpgsql security invoker set search_path = '' as $$
declare ids text[]; eligible integer;
begin
 select array_agg(distinct value) into ids from unnest(photo_ids) value;
 if coalesce(cardinality(ids),0)<1 or cardinality(ids)>100 or decision is null or decision not in ('approved','rejected') then raise exception 'Invalid selection'; end if;
 perform id from public.japan_photo_jobs where id=any(ids) order by id for update;
 select count(*) into eligible from public.japan_photo_jobs where id=any(ids) and status in ('pending_review','needs_inspection','approved','rejected') and (decision='rejected' or candidate_path is not null);
 if eligible<>cardinality(ids) then raise exception 'Selection changed or contains photos without candidates; refresh and retry'; end if;
 update public.japan_photo_jobs set status=decision,updated_at=now() where id=any(ids);
 insert into public.japan_photo_decisions(photo_id,decision) select unnest(ids),decision;
 return cardinality(ids);
end $$;
revoke all on function public.decide_japan_photos(text[],text) from public,anon,authenticated;
grant execute on function public.decide_japan_photos(text[],text) to service_role;
