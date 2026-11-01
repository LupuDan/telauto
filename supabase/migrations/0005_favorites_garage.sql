-- 0005: favorites and "Garajul meu" (user vehicles). Each user sees only their own rows.

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index favorites_listing_idx on public.favorites (listing_id);

create table public.user_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  make_id int not null references public.vehicle_makes (id),
  model_id int,
  year smallint not null check (year between 1950 and 2100),
  label text not null default '' check (char_length(label) <= 40),
  created_at timestamptz not null default now(),
  foreign key (model_id, make_id) references public.vehicle_models (id, make_id)
);

create index user_vehicles_user_idx on public.user_vehicles (user_id);

-- Max 10 cars in the garage.
create or replace function public.check_user_vehicle_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.user_vehicles where user_id = new.user_id) >= 10 then
    raise exception 'GARAGE_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger user_vehicles_limit
  before insert on public.user_vehicles
  for each row execute function public.check_user_vehicle_limit();

alter table public.favorites enable row level security;
alter table public.user_vehicles enable row level security;

revoke all on public.favorites from anon;
revoke all on public.user_vehicles from anon;

create policy "favorites: owner can read"
  on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));

create policy "favorites: owner can add"
  on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "favorites: owner can remove"
  on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "user_vehicles: owner can read"
  on public.user_vehicles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_vehicles: owner can add"
  on public.user_vehicles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_vehicles: owner can update"
  on public.user_vehicles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_vehicles: owner can remove"
  on public.user_vehicles for delete to authenticated
  using (user_id = (select auth.uid()));
