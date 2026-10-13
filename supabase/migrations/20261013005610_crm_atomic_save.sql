-- Requires website_leads. Only the authenticated admin Edge Function may call this.
create or replace function public.save_crm_state(p_payload jsonb, p_expected_version timestamptz)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_version timestamptz;
  next_version timestamptz;
begin
  if jsonb_typeof(p_payload) is distinct from 'object'
    or jsonb_typeof(p_payload->'leads') is distinct from 'array'
    or jsonb_typeof(p_payload->'orders') is distinct from 'array'
    or jsonb_typeof(p_payload->'loanCars') is distinct from 'array' then
    raise exception 'Invalid CRM payload' using errcode = '22023';
  end if;
  -- Also serializes creation when the main row does not exist yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('public.crm_state.main', 0));
  select updated_at into current_version from public.crm_state where id = 'main' for update;
  if current_version is distinct from p_expected_version then
    raise exception 'CRM version conflict' using errcode = '40001';
  end if;
  next_version := greatest(clock_timestamp(), current_version + interval '1 microsecond');
  insert into public.crm_state(id, payload, updated_at)
    values ('main', p_payload, next_version)
    on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;
  -- Failure here rolls back the CRM write too.
  update public.website_leads as w set
    contact = coalesce(btrim(lead->>'contact'), ''),
    channel = coalesce(btrim(lead->>'channel'), ''),
    interest = coalesce(btrim(lead->>'interest'), ''),
    budget = coalesce(btrim(lead->>'budget'), ''),
    status = coalesce(nullif(btrim(lead->>'status'), ''), '了解'),
    next_follow_up = nullif(btrim(lead->>'nextFollowUp'), '')::date,
    notes = coalesce(btrim(lead->>'notes'), ''),
    synced_to_crm_at = next_version
  from jsonb_array_elements(p_payload->'leads') as items(lead)
  where lead->>'id' = 'web:' || w.id::text;
  return jsonb_build_object('saved', true, 'version', next_version);
end;
$$;
revoke all on function public.save_crm_state(jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.save_crm_state(jsonb, timestamptz) to service_role;
