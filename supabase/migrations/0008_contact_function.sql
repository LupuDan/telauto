-- 0008: "Arată telefonul" – phone number, IMEI and VIN only for logged-in users.
-- Visitors (anon) cannot even call this function.

create or replace function public.get_listing_contact(p_listing_id uuid)
returns table (phone text, imei text, vin text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'LOGIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  select pp.phone, lp.imei, lp.vin
  from public.listings l
  join public.profiles p on p.id = l.user_id
  left join public.profile_private pp on pp.user_id = l.user_id
  left join public.listing_private lp on lp.listing_id = l.id
  where l.id = p_listing_id
    and (
      (l.status = 'active' and l.expires_at > now() and not p.is_blocked)
      or l.user_id = auth.uid()
      or public.is_admin()
    );
end;
$$;

revoke execute on function public.get_listing_contact(uuid) from public, anon;
grant execute on function public.get_listing_contact(uuid) to authenticated;
