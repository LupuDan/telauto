-- 0015: administration panel (phase 8).
-- Every function checks is_admin() itself; they are SECURITY DEFINER because they read auth.users (emails)
-- or change several tables in one step. Admins still cannot block themselves or another admin.

---------------------------------------------------------------------------
-- Admins cannot be blocked (on every path: panel, API, SQL editor excluded only for the owner)
---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  if public.is_api_request() then
    if not public.is_admin() then
      if new.role is distinct from old.role or new.is_blocked is distinct from old.is_blocked then
        raise exception 'PROFILE_FIELD_ADMIN_ONLY' using errcode = '42501';
      end if;
    else
      if new.is_blocked and not old.is_blocked and old.id = auth.uid() then
        raise exception 'CANNOT_BLOCK_SELF' using errcode = '42501';
      end if;
      if new.is_blocked and not old.is_blocked and old.role = 'admin' then
        raise exception 'CANNOT_BLOCK_ADMIN' using errcode = '42501';
      end if;
      -- roles are given only from the Supabase SQL editor (see README)
      if new.role is distinct from old.role then
        raise exception 'PROFILE_FIELD_ADMIN_ONLY' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_profile_update() from public, anon, authenticated;

---------------------------------------------------------------------------
-- Users: search (with email) and block / unblock
---------------------------------------------------------------------------
create or replace function public.admin_search_users(p_query text default null, p_limit int default 50)
returns table (
  id uuid,
  email text,
  display_name text,
  role text,
  is_blocked boolean,
  created_at timestamptz,
  active_listings int,
  open_reports int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pattern text := '%' || replace(replace(coalesce(btrim(p_query), ''), '%', ''), '_', '') || '%';
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.role,
    p.is_blocked,
    p.created_at,
    (select count(*)::int from public.listings l where l.user_id = p.id and l.status = 'active'),
    (select count(*)::int from public.reports r join public.listings l on l.id = r.listing_id
       where l.user_id = p.id and r.status = 'open')
  from public.profiles p
  join auth.users u on u.id = p.id
  where pattern = '%%' or p.display_name ilike pattern or u.email ilike pattern
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

-- Same rules as guard_profile_update(), with a clear error for the panel.
create or replace function public.admin_set_user_blocked(p_user_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  if p_blocked and p_user_id = auth.uid() then
    raise exception 'CANNOT_BLOCK_SELF' using errcode = '42501';
  end if;

  select role into target_role from public.profiles where id = p_user_id;
  if target_role is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if p_blocked and target_role = 'admin' then
    raise exception 'CANNOT_BLOCK_ADMIN' using errcode = '42501';
  end if;

  update public.profiles set is_blocked = p_blocked where id = p_user_id;
end;
$$;

---------------------------------------------------------------------------
-- Listings: decision + closing the open reports in one step
---------------------------------------------------------------------------
-- p_action: 'hide' (hidden), 'reject' (rejected), 'restore' (active again, +30 days if already expired)
create or replace function public.admin_moderate_listing(p_listing_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  if p_action not in ('hide', 'reject', 'restore') then
    raise exception 'INVALID_ACTION' using errcode = '22023';
  end if;

  update public.listings
  set status = case p_action when 'hide' then 'hidden' when 'reject' then 'rejected' else 'active' end,
      expires_at = case
        when p_action = 'restore' and expires_at <= now() then now() + interval '30 days'
        else expires_at
      end
  where id = p_listing_id and status <> 'draft';

  if not found then
    raise exception 'LISTING_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.reports
  set status = 'resolved', resolved_at = now(), resolved_by = auth.uid()
  where listing_id = p_listing_id and status = 'open';
end;
$$;

create or replace function public.admin_resolve_message_reports(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  update public.reports
  set status = 'resolved', resolved_at = now(), resolved_by = auth.uid()
  where message_id = p_message_id and status = 'open';
end;
$$;

-- Numbers on the tabs of the panel.
create or replace function public.admin_counts()
returns table (open_reports int, flagged_messages int, hidden_listings int)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;
  return query select
    (select count(distinct coalesce(r.listing_id, r.message_id))::int from public.reports r where r.status = 'open'),
    (select count(*)::int from public.messages m where m.is_flagged and m.created_at > now() - interval '30 days'),
    (select count(*)::int from public.listings l where l.status in ('hidden', 'rejected'));
end;
$$;

---------------------------------------------------------------------------
-- Brands and models: delete only what nothing uses
-- (listing attributes are jsonb, so no foreign key protects them)
---------------------------------------------------------------------------
-- p_kind: 'vehicle_make' | 'vehicle_model' | 'phone_brand' | 'phone_model'
create or replace function public.admin_delete_reference(p_kind text, p_id int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  in_use boolean;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;

  case p_kind
    when 'vehicle_make' then
      in_use := exists (select 1 from public.listings where category_id = 3 and attributes @> jsonb_build_object('make_id', p_id))
        or exists (select 1 from public.listing_compatibility where make_id = p_id)
        or exists (select 1 from public.user_vehicles where make_id = p_id);
      if not in_use then delete from public.vehicle_makes where id = p_id; end if;
    when 'vehicle_model' then
      in_use := exists (select 1 from public.listings where category_id = 3 and attributes @> jsonb_build_object('model_id', p_id))
        or exists (select 1 from public.listing_compatibility where model_id = p_id)
        or exists (select 1 from public.user_vehicles where model_id = p_id);
      if not in_use then delete from public.vehicle_models where id = p_id; end if;
    when 'phone_brand' then
      in_use := p_id = 999
        or exists (select 1 from public.listings where category_id = 1 and attributes @> jsonb_build_object('brand_id', p_id));
      if not in_use then delete from public.phone_brands where id = p_id; end if;
    when 'phone_model' then
      in_use := exists (select 1 from public.listings where category_id = 1 and attributes @> jsonb_build_object('model_id', p_id));
      if not in_use then delete from public.phone_models where id = p_id; end if;
    else
      raise exception 'INVALID_ACTION' using errcode = '22023';
  end case;

  if in_use then
    raise exception 'REFERENCE_IN_USE' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_search_users(text, int) from public, anon;
revoke execute on function public.admin_set_user_blocked(uuid, boolean) from public, anon;
revoke execute on function public.admin_moderate_listing(uuid, text) from public, anon;
revoke execute on function public.admin_resolve_message_reports(uuid) from public, anon;
revoke execute on function public.admin_counts() from public, anon;
revoke execute on function public.admin_delete_reference(text, int) from public, anon;
grant execute on function public.admin_search_users(text, int) to authenticated;
grant execute on function public.admin_set_user_blocked(uuid, boolean) to authenticated;
grant execute on function public.admin_moderate_listing(uuid, text) to authenticated;
grant execute on function public.admin_resolve_message_reports(uuid) to authenticated;
grant execute on function public.admin_counts() to authenticated;
grant execute on function public.admin_delete_reference(text, int) to authenticated;
