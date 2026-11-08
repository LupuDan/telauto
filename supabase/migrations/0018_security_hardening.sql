-- 0018: security hardening (audit of 2026-11-08).
--  1. "Arată telefonul": max 40 different listings per 24 hours per user, so nobody can collect
--     every seller's phone number / IMEI / VIN with a script.
--  2. "Șterge contul": the server itself demands a password login from the last 10 minutes
--     (until now only the website checked the password, a stolen session could skip that).
--  3. Photo storage: limits on the number of files (per listing folder, per day, avatars),
--     so nobody can fill the storage space with uploads.
--  4. New conversations: max 40 per 24 hours (stops "write to every seller" spam).
--  5. Reports: max 20 per 24 hours (stops mass reporting from one account).

---------------------------------------------------------------------------
-- 1. Phone / IMEI / VIN reveals
---------------------------------------------------------------------------

-- Internal log: who opened which contact (kept 24 hours). Nobody can read it through the API.
create table public.contact_reveals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index contact_reveals_user_created_idx on public.contact_reveals (user_id, created_at);

alter table public.contact_reveals enable row level security;
revoke all on public.contact_reveals from public, anon, authenticated;

-- Same as 0008, plus the limit. Opening the same listing again does not count twice.
-- The author's own listings and admins are not limited.
-- VOLATILE (not stable) because it writes to contact_reveals.
create or replace function public.get_listing_contact(p_listing_id uuid)
returns table (phone text, imei text, vin text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_recent int;
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'LOGIN_REQUIRED' using errcode = '42501';
  end if;

  select l.user_id into v_owner from public.listings l where l.id = p_listing_id;

  if v_owner is not null and v_owner <> auth.uid() and not public.is_admin() then
    perform pg_advisory_xact_lock(hashtextextended('contact_limit:' || auth.uid()::text, 0));

    delete from public.contact_reveals
    where user_id = auth.uid() and created_at <= now() - interval '24 hours';

    if not exists (
      select 1 from public.contact_reveals where user_id = auth.uid() and listing_id = p_listing_id
    ) then
      select count(*) into v_recent from public.contact_reveals where user_id = auth.uid();
      if v_recent >= 40 then
        raise exception 'CONTACT_LIMIT_REACHED' using errcode = 'P0001';
      end if;
    end if;
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

  -- only reveals that really returned something are counted
  if found and v_owner <> auth.uid() and not public.is_admin() then
    insert into public.contact_reveals (user_id, listing_id)
    values (auth.uid(), p_listing_id)
    on conflict (user_id, listing_id) do nothing;
  end if;
end;
$$;

revoke execute on function public.get_listing_contact(uuid) from public, anon;
grant execute on function public.get_listing_contact(uuid) to authenticated;

---------------------------------------------------------------------------
-- 2. Delete account: password entered in the last 10 minutes
---------------------------------------------------------------------------

-- The login token lists when the person last proved who they are ("amr" = [{method, timestamp}]).
-- The website logs in again with the password right before deleting, so this is always fresh there.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_last_login bigint;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED' using errcode = '42501';
  end if;

  select max((entry ->> 'timestamp')::bigint) into v_last_login
  from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as entry
  where jsonb_typeof(entry -> 'timestamp') = 'number';

  if v_last_login is null or v_last_login < extract(epoch from now())::bigint - 600 then
    raise exception 'REAUTH_REQUIRED' using errcode = '42501';
  end if;

  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

---------------------------------------------------------------------------
-- 3. Storage limits
---------------------------------------------------------------------------

-- listing-images: max 30 files in one listing folder (10 photos + replacements in progress)
--                 and max 300 uploads per user in 24 hours.
-- avatars:        max 3 files per user (the website keeps only one).
-- SECURITY DEFINER: counts files the caller may not list themselves.
create or replace function public.storage_upload_allowed(p_bucket text, p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner text := (storage.foldername(p_name))[1];
  v_listing text := (storage.foldername(p_name))[2];
begin
  if auth.uid() is null or v_owner is distinct from auth.uid()::text then
    return false;
  end if;

  if p_bucket = 'listing-images' then
    return (
      select count(*) from storage.objects o
      where o.bucket_id = 'listing-images' and o.name like v_owner || '/' || v_listing || '/%'
    ) < 30
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'listing-images' and o.name like v_owner || '/%'
        and o.created_at > now() - interval '24 hours'
    ) < 300;
  elsif p_bucket = 'avatars' then
    return (
      select count(*) from storage.objects o
      where o.bucket_id = 'avatars' and o.name like v_owner || '/%'
    ) < 3;
  end if;
  return false;
end;
$$;

revoke execute on function public.storage_upload_allowed(text, text) from public, anon;
grant execute on function public.storage_upload_allowed(text, text) to authenticated;

drop policy "listing-images: owner can upload" on storage.objects;
create policy "listing-images: owner can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (select public.is_active_user())
    and public.owns_listing_folder(name)
    and public.storage_upload_allowed(bucket_id, name)
  );

drop policy "avatars: owner can upload" on storage.objects;
create policy "avatars: owner can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
    and public.storage_upload_allowed(bucket_id, name)
  );

---------------------------------------------------------------------------
-- 4. New conversations: max 40 per 24 hours
---------------------------------------------------------------------------

create or replace function public.start_conversation(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller uuid;
  v_conversation uuid;
begin
  if not public.is_active_user() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;

  select l.user_id into v_seller
  from public.listings l
  join public.profiles p on p.id = l.user_id
  where l.id = p_listing_id
    and l.status = 'active'
    and l.expires_at > now()
    and not p.is_blocked;

  if v_seller is null then
    raise exception 'LISTING_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_seller = auth.uid() then
    raise exception 'OWN_LISTING' using errcode = 'P0001';
  end if;

  select id into v_conversation
  from public.conversations
  where listing_id = p_listing_id and buyer_id = auth.uid();

  if v_conversation is not null then
    return v_conversation;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('conversation_limit:' || auth.uid()::text, 0));
  if (
    select count(*) from public.conversations
    where buyer_id = auth.uid() and created_at > now() - interval '24 hours'
  ) >= 40 then
    raise exception 'CONVERSATION_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  insert into public.conversations (listing_id, buyer_id, seller_id)
  values (p_listing_id, auth.uid(), v_seller)
  on conflict (listing_id, buyer_id) do nothing;

  select id into v_conversation
  from public.conversations
  where listing_id = p_listing_id and buyer_id = auth.uid();

  return v_conversation;
end;
$$;

revoke execute on function public.start_conversation(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;

---------------------------------------------------------------------------
-- 5. Reports: max 20 per 24 hours
---------------------------------------------------------------------------

-- SECURITY DEFINER because people cannot read reports (only admins), so a normal count would see 0.
-- Admins are not limited. The insert policy already makes reporter_id = the caller.
create or replace function public.check_report_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reporter_id is null or public.is_admin() then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('report_limit:' || new.reporter_id::text, 0));
  if (
    select count(*) from public.reports
    where reporter_id = new.reporter_id and created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'REPORT_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.check_report_limit();

revoke execute on function public.check_report_limit() from public, anon, authenticated;
