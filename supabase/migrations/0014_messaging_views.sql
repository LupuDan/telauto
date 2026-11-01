-- 0014: messaging pages (phase 7).
-- The conversation list needs the other person's name and the listing (title, price, photo) even when
-- the listing is no longer public (sold, expired), which RLS on listings would hide from the buyer.
-- These SECURITY DEFINER functions return only conversations of the caller (auth.uid()).

create or replace function public.get_my_conversations(p_conversation_id uuid default null)
returns table (
  id uuid,
  listing_id uuid,
  listing_title text,
  listing_price numeric,
  listing_currency text,
  listing_cover text,
  -- the listing is still public (active, not expired)
  listing_available boolean,
  other_user_id uuid,
  other_name text,
  i_am_seller boolean,
  last_message_at timestamptz,
  last_body text,
  last_from_me boolean,
  unread_count int,
  -- both accounts still exist and the caller is not blocked
  can_reply boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.listing_id,
    l.title,
    l.price,
    l.currency,
    (select i.storage_path from public.listing_images i where i.listing_id = l.id order by i.position limit 1),
    coalesce(l.status = 'active' and l.expires_at > now(), false),
    case when c.buyer_id = auth.uid() then c.seller_id else c.buyer_id end,
    other.display_name,
    c.seller_id = auth.uid(),
    c.last_message_at,
    last_msg.body,
    last_msg.sender_id = auth.uid(),
    (
      select count(*)::int from public.messages m
      where m.conversation_id = c.id and m.sender_id is distinct from auth.uid() and m.read_at is null
    ),
    c.buyer_id is not null and c.seller_id is not null and public.is_active_user()
  from public.conversations c
  left join public.listings l on l.id = c.listing_id
  left join public.profiles other
    on other.id = case when c.buyer_id = auth.uid() then c.seller_id else c.buyer_id end
  left join lateral (
    select m.body, m.sender_id
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_msg on true
  where auth.uid() in (c.buyer_id, c.seller_id)
    and (p_conversation_id is null or c.id = p_conversation_id)
    -- the seller does not see conversations the buyer opened but never wrote in
    and (c.buyer_id = auth.uid() or last_msg.body is not null)
  order by c.last_message_at desc
  limit 200;
$$;

-- Number on the ✉ icon in the header.
create or replace function public.count_unread_messages()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where auth.uid() in (c.buyer_id, c.seller_id)
    and m.sender_id is distinct from auth.uid()
    and m.read_at is null;
$$;

revoke execute on function public.get_my_conversations(uuid) from public, anon;
revoke execute on function public.count_unread_messages() from public, anon;
grant execute on function public.get_my_conversations(uuid) to authenticated;
grant execute on function public.count_unread_messages() to authenticated;
