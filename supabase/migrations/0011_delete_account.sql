-- 0011: "Șterge contul" (plan, section 8).
-- The website first deletes the user's photos through the Storage API (SQL may not delete storage files),
-- then calls this function. Deleting the auth user cascades to: profile, private data, listings
-- (with images rows, IMEI/VIN, compatibility), favorites, garage.
-- Conversations and messages stay for the other person: sender/buyer/seller become NULL ("Utilizator șters").

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED' using errcode = '42501';
  end if;

  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
