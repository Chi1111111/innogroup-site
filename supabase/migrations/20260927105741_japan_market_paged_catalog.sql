create or replace function public.japan_market_catalog_page(filters jsonb default '{}'::jsonb)
returns jsonb language sql stable security invoker set search_path = '' as $$
with base as materialized (
 select v.id,p->>'make' make,p->>'model' model,coalesce(p->>'variant','') variant,
 (p->>'year')::integer as year,(p->>'mileage')::numeric mileage,
 (p->>'fobPriceNzd')::numeric price,p->>'fuelType' fuel,p->>'bodyType' body,p->>'updatedAt' updated
 from public.japan_photo_vehicles v join public.japan_photo_ready_gallery g on g.id=v.id
 cross join lateral (select v.payload p) d
 where upper(trim(p->>'sourcePriceType'))='FOB' and p->>'priceBasis'='FOB' and p->>'priceCurrency'='NZD'
 and p->'fobPriceEstimated' is distinct from 'true'::jsonb
 and case when jsonb_typeof(p->'fobPriceNzd')='number' then (p->>'fobPriceNzd')::numeric>0 else false end
 and p->>'status' is distinct from 'Unavailable'
 and length(trim(p->>'make')) between 1 and 40
 and p->>'make' !~* 'https?|www|\metc\M|/\*'
 and p->>'make' ~ '^[[:alnum:] .&''’()/-]+$'
 and length(trim(p->>'model')) between 1 and 80 and p->>'model' !~* '[<>={}�]|/\*|https?:|www\.|\?{2,}'
 and case when p->>'year' ~ '^[0-9]{4}$' then (p->>'year')::integer between 1900 and extract(year from now())+1 else false end
 and case when jsonb_typeof(p->'mileage')='number' then (p->>'mileage')::numeric between 0 and 2000000 else false end
),
matched as materialized (
 select * from base b where
 (coalesce(filters->>'make','')='' or (filters->>'make'='Other' and b.make<>all(array['Toyota','Lexus','Nissan','Honda','Mazda','Subaru','Mitsubishi','BMW','Mercedes-Benz','Audi','Volkswagen','Porsche'])) or b.make=filters->>'make')
 and (coalesce(filters->>'model','')='' or b.model=filters->>'model')
 and (coalesce(filters->>'makeSlug','')='' or trim(both '-' from regexp_replace(replace(lower(b.make),'&','and'),'[^a-z0-9]+','-','g'))=filters->>'makeSlug')
 and (coalesce(filters->>'modelSlug','')='' or trim(both '-' from regexp_replace(replace(lower(b.model),'&','and'),'[^a-z0-9]+','-','g'))=filters->>'modelSlug')
 and not exists (select 1 from regexp_split_to_table(lower(trim(coalesce(filters->>'q',''))),'\s+') token where token<>'' and strpos(lower(concat_ws(' ',b.year,b.make,b.model,b.variant)),token)=0)
 and (nullif(filters->>'yearFrom','') is null or b.year>=(filters->>'yearFrom')::integer)
 and (nullif(filters->>'yearTo','') is null or b.year<=(filters->>'yearTo')::integer)
 and (nullif(filters->>'minPrice','') is null or b.price>=(filters->>'minPrice')::numeric)
 and (nullif(filters->>'maxPrice','') is null or b.price<(filters->>'maxPrice')::numeric)
 and (nullif(filters->>'mileage','') is null or b.mileage<(filters->>'mileage')::numeric)
 and (coalesce(jsonb_array_length(filters->'fuels'),0)=0 or filters->'fuels' ? b.fuel)
 and (coalesce(jsonb_array_length(filters->'bodies'),0)=0 or filters->'bodies' ? b.body)
),
totals as (select count(*) n from matched),
paging as (select greatest(1,least(coalesce((filters->>'page')::integer,1),greatest(1,ceil(n/24.0)::integer))) page,n from totals),
selection as (
 select b.id,row_number() over (order by
 case when filters->>'sort'='price-asc' then price end asc,
 case when filters->>'sort'='price-desc' then price end desc,
 case when filters->>'sort'='year' then year end desc,
 case when filters->>'sort'='mileage' then mileage end asc,
 case when filters->>'sort'='newest' then updated end desc nulls last,
 case when coalesce(filters->>'sort','recommended')='recommended' then md5(b.id || (now() at time zone 'Pacific/Auckland')::date::text) end,
 b.id) rank from matched b
),
page_rows as (select s.id,s.rank from selection s,paging p where s.rank>(p.page-1)*24 and s.rank<=p.page*24),
facets as (select make,model,min(year) as year from base group by make,model)
select jsonb_build_object(
 'count',(select n from totals),'totalCount',(select count(*) from base),'page',(select page from paging),'pageSize',24,
 'rotationDay',(now() at time zone 'Pacific/Auckland')::date::text,
 'facets',coalesce((select jsonb_agg(to_jsonb(f) order by make,model) from facets f),'[]'::jsonb),
 'rows',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'payload',v.payload-'imageUrl'-'imageUrls'-'sourceUrl','photo_ids',jsonb_build_array(g.photo_ids[1]),'photoCount',cardinality(g.photo_ids)) order by s.rank) from page_rows s join public.japan_photo_vehicles v on v.id=s.id join public.japan_photo_ready_gallery g on g.id=s.id),'[]'::jsonb)
)
$$;
revoke all on function public.japan_market_catalog_page(jsonb) from public,anon,authenticated;
grant execute on function public.japan_market_catalog_page(jsonb) to service_role;
