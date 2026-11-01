-- 0007: reports of listings and messages; auto-hide after 3 open reports.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  listing_id uuid references public.listings (id) on delete cascade,
  message_id uuid references public.messages (id) on delete cascade,
  reason text not null check (reason in ('scam', 'prohibited', 'wrong_category', 'duplicate', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  -- a report is about exactly one thing: a listing OR a message
  check (num_nonnulls(listing_id, message_id) = 1)
);

-- one report per person per listing / message
create unique index reports_reporter_listing_unique
  on public.reports (reporter_id, listing_id) where listing_id is not null;
create unique index reports_reporter_message_unique
  on public.reports (reporter_id, message_id) where message_id is not null;
create index reports_open_idx on public.reports (status, created_at desc);
create index reports_listing_idx on public.reports (listing_id) where listing_id is not null;

-- Not SECURITY DEFINER: is_api_request() must see the real caller.
create or replace function public.before_report_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_request() then
    new.status := 'open';
    new.created_at := now();
    new.resolved_at := null;
    new.resolved_by := null;
  end if;
  return new;
end;
$$;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.before_report_insert();

-- 3 open reports from different users => listing becomes "hidden" until an admin checks it.
create or replace function public.after_report_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.listing_id is not null and new.status = 'open' then
    if (
      select count(distinct reporter_id)
      from public.reports
      where listing_id = new.listing_id and status = 'open'
    ) >= 3 then
      update public.listings
      set status = 'hidden'
      where id = new.listing_id and status = 'active';
    end if;
  end if;
  return new;
end;
$$;

create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.after_report_insert();

alter table public.reports enable row level security;
revoke all on public.reports from anon;

-- Logged-in users can report what they can see: a visible listing, or a message in their own conversation
-- (the subqueries are filtered by the listings / messages policies).
create policy "reports: active users can create"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (select public.is_active_user())
    and (
      (listing_id is not null and exists (select 1 from public.listings l where l.id = listing_id))
      or (message_id is not null and exists (select 1 from public.messages m where m.id = message_id))
    )
  );

create policy "reports: admins can read"
  on public.reports for select to authenticated
  using ((select public.is_admin()));

create policy "reports: admins can update"
  on public.reports for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "reports: admins can delete"
  on public.reports for delete to authenticated
  using ((select public.is_admin()));

-- Admins may read messages that were reported (in addition to flagged ones, see 0006).
create policy "messages: admins can read reported"
  on public.messages for select to authenticated
  using (
    (select public.is_admin())
    and exists (select 1 from public.reports r where r.message_id = messages.id)
  );
