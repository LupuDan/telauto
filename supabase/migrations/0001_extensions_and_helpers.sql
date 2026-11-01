-- 0001: extensions and shared helper functions
-- Safe to run on a clean Supabase project.

create extension if not exists unaccent with schema extensions;

-- unaccent() is not IMMUTABLE, so it cannot be used in a generated column.
-- This wrapper pins the dictionary, which makes it safe to mark immutable.
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, input)
$$;

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True when the request comes directly from the website (Supabase API roles).
-- Inside SECURITY DEFINER functions and in the SQL Editor current_user is the
-- function owner / postgres, so trusted server-side code is not restricted.
-- IMPORTANT: only call this from functions that are NOT security definer.
create or replace function public.is_api_request()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated')
$$;

-- Is the logged-in user an (unblocked) admin?
-- plpgsql: the body is checked at call time, so public.profiles may be created later (0003).
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not is_blocked
  );
end;
$$;

-- Is the logged-in user allowed to create content (logged in and not blocked)?
create or replace function public.is_active_user()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and not is_blocked
  );
end;
$$;

-- IMEI: exactly 15 digits with a valid Luhn check digit (plan, section 6).
create or replace function public.is_valid_imei(imei text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  total int := 0;
  digit int;
  i int;
begin
  if imei is null or imei !~ '^[0-9]{15}$' then
    return false;
  end if;
  for i in 1..15 loop
    digit := substr(imei, i, 1)::int;
    if i % 2 = 0 then
      digit := digit * 2;
      if digit > 9 then
        digit := digit - 9;
      end if;
    end if;
    total := total + digit;
  end loop;
  return total % 10 = 0;
end;
$$;

-- VIN: 17 characters, digits and capital letters except I, O, Q.
create or replace function public.is_valid_vin(vin text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select vin ~ '^[A-HJ-NPR-Z0-9]{17}$'
$$;
