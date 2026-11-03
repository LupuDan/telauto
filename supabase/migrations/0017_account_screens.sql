-- 0017: "Contul meu" (plan de design, 6.6).
--  1. Profile photo: profiles.avatar_path + public bucket "avatars" (<user_id>/<uuid>.webp|jpg).
--  2. my_listing_saves(): how many people saved each of MY listings (number only, never who).
--  3. my_unavailable_favorites(): title, price and cover of my saved listings that were sold or
--     expired meanwhile (normal RLS hides them from me), so the favorites list can show them faded.

---------------------------------------------------------------------------
-- 1. Profile photo
---------------------------------------------------------------------------

alter table public.profiles
  add column avatar_path text
  check (avatar_path is null or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(webp|jpg)$'));

-- The website shrinks the photo to 400 × 400 px (~60 KB) before upload; 512 KB is the hard limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Only into one's own folder, and only users who are not blocked.
create policy "avatars: owner can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );

-- Needed by the storage API for listing and deleting own files.
create policy "avatars: owner or admin can read via API"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

create policy "avatars: owner or admin can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

---------------------------------------------------------------------------
-- 2. Number of saves of my listings
---------------------------------------------------------------------------

create or replace function public.my_listing_saves()
returns table (listing_id uuid, saves integer)
language sql
stable
security definer
set search_path = ''
as $$
  select f.listing_id, count(*)::integer
  from public.favorites f
  join public.listings l on l.id = f.listing_id
  where l.user_id = auth.uid()
  group by f.listing_id
$$;

revoke execute on function public.my_listing_saves() from public, anon;
grant execute on function public.my_listing_saves() to authenticated;

---------------------------------------------------------------------------
-- 3. My saved listings that are no longer available
---------------------------------------------------------------------------

-- Only sold or expired listings (the person saw them while they were public).
-- Hidden, rejected or draft listings stay hidden: they come back without title and photo.
create or replace function public.my_unavailable_favorites()
returns table (listing_id uuid, title text, price numeric, currency text, cover_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.title,
    l.price,
    l.currency,
    (select i.storage_path from public.listing_images i where i.listing_id = l.id order by i.position limit 1)
  from public.favorites f
  join public.listings l on l.id = f.listing_id
  where f.user_id = auth.uid()
    and (l.status = 'sold' or (l.status = 'active' and l.expires_at <= now()))
$$;

revoke execute on function public.my_unavailable_favorites() from public, anon;
grant execute on function public.my_unavailable_favorites() to authenticated;
