-- 0016: fixes "infinite recursion detected in policy for relation reports" (found by the phase 8 test).
-- The insert rule of reports reads messages ("you can report only a message you can see"), and the
-- admin rule of messages read reports ("admins see reported messages"): Postgres refuses this loop.
-- The admin rule now asks a SECURITY DEFINER function, which does not go through the reports policies.

create or replace function public.message_has_report(p_message_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- only admins learn whether a message was reported
  if not public.is_admin() then
    return false;
  end if;
  return exists (select 1 from public.reports r where r.message_id = p_message_id);
end;
$$;

revoke execute on function public.message_has_report(uuid) from public, anon;
grant execute on function public.message_has_report(uuid) to authenticated;

drop policy "messages: admins can read reported" on public.messages;

create policy "messages: admins can read reported"
  on public.messages for select to authenticated
  using ((select public.is_admin()) and public.message_has_report(id));
