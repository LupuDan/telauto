-- 0003: user profiles.
-- profiles         = public part (name, locality, member since, role, blocked flag)
-- profile_private  = phone number; never readable by visitors, only via get_listing_contact()

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  locality_id smallint references public.localities (id) on delete set null,
  language text not null default 'ro' check (language in ('ro', 'ru')),
  role text not null default 'user' check (role in ('user', 'admin')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- Moldovan or international format, digits with optional leading +
  phone text check (phone is null or phone ~ '^\+?[0-9]{8,15}$'),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profile_private_set_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();

-- Create the profile automatically when someone registers.
-- display_name and language can be passed in signUp({ options: { data: {...} } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, language)
  values (
    new.id,
    coalesce(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), ''),
    case when new.raw_user_meta_data ->> 'language' = 'ru' then 'ru' else 'ro' end
  );
  insert into public.profile_private (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name, locality and language only.
-- role and is_blocked can be changed only by admins (or in the Supabase dashboard).
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  if public.is_api_request() and not public.is_admin() then
    if new.role is distinct from old.role or new.is_blocked is distinct from old.is_blocked then
      raise exception 'PROFILE_FIELD_ADMIN_ONLY' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

create policy "profiles: everyone can read"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "profiles: owner or admin can update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- Visitors have no access at all to private data.
revoke all on public.profile_private from anon;

create policy "profile_private: owner or admin can read"
  on public.profile_private for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "profile_private: owner can update"
  on public.profile_private for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
