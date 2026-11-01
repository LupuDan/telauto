-- 0013: search (phase 5).
-- search_listings() is the only way the website lists listings (home, category, search,
-- public profile, similar listings). It is SECURITY DEFINER so it can return the
-- "IMEI indicat" / "VIN indicat" flags without exposing the values themselves; because of
-- that, the visibility rules (active, not expired, author not blocked) are written here explicitly.

-- Approximate rate used only to compare and sort MDL and EUR prices together.
create or replace function public.price_in_mdl(p_price numeric, p_currency text)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case when p_currency = 'EUR' then p_price * 20 else p_price end;
$$;

-- Turns free text into a prefix query: "iphon 13" -> 'iphon':* & '13':*
-- Works the same for Romanian and Russian, with or without diacritics.
create or replace function public.build_search_query(p_text text)
returns tsquery
language plpgsql
immutable
set search_path = ''
as $$
declare
  query_text text;
begin
  if p_text is null or btrim(p_text) = '' then
    return null;
  end if;

  select string_agg(quote_literal(word) || ':*', ' & ')
  into query_text
  from (
    select regexp_replace(lexeme, '[^[:alnum:]]', '', 'g') as word
    from unnest(tsvector_to_array(
      to_tsvector('simple'::regconfig, public.immutable_unaccent(lower(left(p_text, 100))))
    )) as lexeme
  ) words
  where word <> '';

  return case when query_text is null then null else to_tsquery('simple'::regconfig, query_text) end;
end;
$$;

create or replace function public.search_listings(
  p_category_id smallint default null,
  p_query text default null,
  p_locality_id smallint default null,
  p_condition text default null,
  -- price range in p_currency; EUR/MDL prices are compared via price_in_mdl()
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_currency text default 'MDL',
  -- exact matches on attributes, e.g. {"brand_id": 3, "fuel": "diesel"}
  p_attributes jsonb default '{}'::jsonb,
  -- numeric ranges on attributes, e.g. {"year": [2010, 2018], "mileage_km": [null, 200000]}
  p_ranges jsonb default '{}'::jsonb,
  -- auto parts compatible with a car (make, optional model, optional year)
  p_compat_make_id int default null,
  p_compat_model_id int default null,
  p_compat_year smallint default null,
  p_user_id uuid default null,
  p_exclude_id uuid default null,
  -- 'new' | 'cheap' | 'expensive'
  p_sort text default 'new',
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  user_id uuid,
  category_id smallint,
  title text,
  price numeric,
  currency text,
  negotiable boolean,
  condition text,
  locality_id smallint,
  attributes jsonb,
  created_at timestamptz,
  cover_path text,
  has_imei boolean,
  has_vin boolean,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  search_query tsquery := public.build_search_query(p_query);
  min_mdl numeric := public.price_in_mdl(p_price_min, p_currency);
  max_mdl numeric := public.price_in_mdl(p_price_max, p_currency);
begin
  if jsonb_typeof(coalesce(p_attributes, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_ranges, '{}'::jsonb)) <> 'object' then
    raise exception 'INVALID_FILTER' using errcode = '22023';
  end if;

  return query
  select
    l.id,
    l.user_id,
    l.category_id,
    l.title,
    l.price,
    l.currency,
    l.negotiable,
    l.condition,
    l.locality_id,
    l.attributes,
    l.created_at,
    (select i.storage_path from public.listing_images i where i.listing_id = l.id order by i.position limit 1),
    exists (select 1 from public.listing_private lp where lp.listing_id = l.id and lp.imei is not null),
    exists (select 1 from public.listing_private lp where lp.listing_id = l.id and lp.vin is not null),
    count(*) over ()
  from public.listings l
  join public.profiles p on p.id = l.user_id
  where l.status = 'active'
    and l.expires_at > now()
    and not p.is_blocked
    and (p_category_id is null or l.category_id = p_category_id)
    and (search_query is null or l.search_vector @@ search_query)
    and (p_locality_id is null or l.locality_id = p_locality_id)
    and (p_condition is null or l.condition = p_condition)
    and (min_mdl is null or public.price_in_mdl(l.price, l.currency) >= min_mdl)
    and (max_mdl is null or public.price_in_mdl(l.price, l.currency) <= max_mdl)
    and (p_attributes is null or l.attributes @> p_attributes)
    and (p_user_id is null or l.user_id = p_user_id)
    and (p_exclude_id is null or l.id <> p_exclude_id)
    -- every range must match; values that are missing or not numbers do not match
    and not exists (
      select 1
      from jsonb_each(coalesce(p_ranges, '{}'::jsonb)) as r(key, bounds)
      where coalesce(
        case when jsonb_typeof(l.attributes -> r.key) = 'number' then
          (case when jsonb_typeof(r.bounds -> 0) = 'number'
                then (l.attributes ->> r.key)::numeric >= (r.bounds ->> 0)::numeric else true end)
          and
          (case when jsonb_typeof(r.bounds -> 1) = 'number'
                then (l.attributes ->> r.key)::numeric <= (r.bounds ->> 1)::numeric else true end)
        end,
        false
      ) = false
    )
    and (
      p_compat_make_id is null
      or exists (
        select 1 from public.listing_compatibility c
        where c.listing_id = l.id
          and c.make_id = p_compat_make_id
          and (p_compat_model_id is null or c.model_id is null or c.model_id = p_compat_model_id)
          and (p_compat_year is null or p_compat_year between c.year_from and c.year_to)
      )
    )
  order by
    case when p_sort = 'cheap' then public.price_in_mdl(l.price, l.currency) end asc nulls last,
    case when p_sort = 'expensive' then public.price_in_mdl(l.price, l.currency) end desc nulls last,
    l.created_at desc,
    l.id
  limit least(greatest(coalesce(p_limit, 24), 1), 48)
  offset least(greatest(coalesce(p_offset, 0), 0), 10000);
end;
$$;

-- "IMEI indicat" / "VIN indicat" on the listing page (values stay private).
create or replace function public.get_listing_badges(p_listing_id uuid)
returns table (has_imei boolean, has_vin boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select lp.imei is not null, lp.vin is not null
  from public.listings l
  join public.profiles p on p.id = l.user_id
  join public.listing_private lp on lp.listing_id = l.id
  where l.id = p_listing_id
    and (
      (l.status = 'active' and l.expires_at > now() and not p.is_blocked)
      or l.user_id = auth.uid()
      or public.is_admin()
    );
$$;

revoke execute on function public.search_listings(
  smallint, text, smallint, text, numeric, numeric, text, jsonb, jsonb, int, int, smallint, uuid, uuid, text, int, int
) from public;
grant execute on function public.search_listings(
  smallint, text, smallint, text, numeric, numeric, text, jsonb, jsonb, int, int, smallint, uuid, uuid, text, int, int
) to anon, authenticated;

revoke execute on function public.get_listing_badges(uuid) from public;
grant execute on function public.get_listing_badges(uuid) to anon, authenticated;

-- price sorting/filtering index (category + converted price)
create index listings_price_mdl_idx
  on public.listings (category_id, (public.price_in_mdl(price, currency)))
  where status = 'active';
