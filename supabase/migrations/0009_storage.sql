-- 0009: photo storage. Bucket "listing-images", public for reading (photos are opened by URL).
-- A user may upload only into <their user_id>/<their listing_id>/.
-- The website shrinks photos to max 1600px / ~500 KB before upload; 1 MB is the hard limit here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Folder belongs to the user AND the listing belongs to the user.
create or replace function public.owns_listing_folder(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (storage.foldername(object_name))[1] = auth.uid()::text
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(object_name))[2]
        and l.user_id = auth.uid()
    )
$$;

create policy "listing-images: owner can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (select public.is_active_user())
    and public.owns_listing_folder(name)
  );

-- Needed by the storage API for listing, replacing and deleting own files.
create policy "listing-images: owner or admin can read via API"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'listing-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

create policy "listing-images: owner can replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'listing-images' and public.owns_listing_folder(name));

create policy "listing-images: owner or admin can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
