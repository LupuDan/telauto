-- 0006: buyer <-> seller conversations about a listing, and messages.
-- When an account or a listing is deleted the conversation stays for the other person:
-- the link becomes NULL and the website shows "Utilizator șters" / "Anunț șters".

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  buyer_id uuid references public.profiles (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id is distinct from seller_id or buyer_id is null)
);

create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_idx on public.conversations (seller_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  is_flagged boolean not null default false
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_sender_created_idx on public.messages (sender_id, created_at desc);
create index messages_flagged_idx on public.messages (created_at desc) where is_flagged;

-- Suspicious content: external links or typical scam words (plan, section 5.3).
create or replace function public.is_suspicious_message(body text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with t as (select public.immutable_unaccent(lower(body)) as txt)
  select
    -- links
    txt ~ '(https?://|www\.|t\.me/|wa\.me/)'
    or txt ~ '\m[a-z0-9-]+\.(com|net|org|ru|md|ua|info|biz|xyz|top|site|online|shop|store|io|me|link|ly|click)\M'
    -- Romanian keywords (diacritics removed by unaccent)
    or txt ~ '\m(avans|avansul|avansului|card|cardul|cardului|cardurile|curier|curierul|curierului)\M'
    -- Russian keywords
    or txt ~ '(предоплат|аванс|курьер|на карту|номер карты|данные карты|картой)'
  from t
$$;

-- Not SECURITY DEFINER: is_api_request() must see the real caller.
-- Max 30 messages per hour per user; server sets dates and the flag.
create or replace function public.before_message_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  sent_last_hour int;
begin
  if public.is_api_request() then
    new.created_at := now();
    new.read_at := null;

    perform pg_advisory_xact_lock(hashtextextended('message_limit:' || coalesce(new.sender_id::text, ''), 0));

    -- the sender can see all messages of their own conversations, so the count is complete
    select count(*) into sent_last_hour
    from public.messages
    where sender_id = new.sender_id and created_at > now() - interval '1 hour';

    if sent_last_hour >= 30 then
      raise exception 'MESSAGE_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  new.is_flagged := public.is_suspicious_message(new.body);
  return new;
end;
$$;

create trigger messages_before_insert
  before insert on public.messages
  for each row execute function public.before_message_insert();

create or replace function public.after_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.after_message_insert();

-- Opens (or returns the existing) conversation for a listing.
-- Refuses your own listing and listings that are not visible.
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

  insert into public.conversations (listing_id, buyer_id, seller_id)
  values (p_listing_id, auth.uid(), v_seller)
  on conflict (listing_id, buyer_id) do nothing;

  select id into v_conversation
  from public.conversations
  where listing_id = p_listing_id and buyer_id = auth.uid();

  return v_conversation;
end;
$$;

-- Marks the other person's messages in a conversation as read.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages m
  set read_at = now()
  from public.conversations c
  where m.conversation_id = c.id
    and c.id = p_conversation_id
    and auth.uid() in (c.buyer_id, c.seller_id)
    and m.sender_id is distinct from auth.uid()
    and m.read_at is null;
$$;

revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.conversations from anon;
revoke all on public.messages from anon;

-- Conversations are created only through start_conversation() (no insert policy).
create policy "conversations: participants can read"
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

create policy "messages: participants can read, admins see flagged"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
    or (is_flagged and (select public.is_admin()))
  );

-- Only when both people still have an account.
create policy "messages: participants can send"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
        and c.buyer_id is not null
        and c.seller_id is not null
    )
  );

-- Live chat: send new messages to the browser (Realtime still applies the RLS rules above).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
