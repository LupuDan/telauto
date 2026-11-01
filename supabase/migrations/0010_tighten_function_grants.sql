-- 0010: remove API access to internal functions (found by `supabase db advisors`).
-- Trigger functions run automatically; nobody needs to call them through /rest/v1/rpc.
-- (PostgreSQL does not check EXECUTE when a trigger fires, so the triggers keep working.)

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.after_message_insert() from public, anon, authenticated;
revoke execute on function public.after_report_insert() from public, anon, authenticated;
revoke execute on function public.check_listing_image_limit() from public, anon, authenticated;
revoke execute on function public.check_user_vehicle_limit() from public, anon, authenticated;
revoke execute on function public.before_listing_insert() from public, anon, authenticated;
revoke execute on function public.before_message_insert() from public, anon, authenticated;
revoke execute on function public.before_report_insert() from public, anon, authenticated;
revoke execute on function public.guard_listing_update() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;

-- Used only by storage policies for logged-in users.
revoke execute on function public.owns_listing_folder(text) from public, anon;
grant execute on function public.owns_listing_folder(text) to authenticated;

-- Intentionally callable (they check permissions themselves):
--   is_admin(), is_active_user()      used inside RLS policies, also for visitors; return true/false only
--   increment_listing_views()         visitors' views are counted too
--   get_listing_contact(), start_conversation(), mark_conversation_read(), reactivate_listing()
--                                     logged-in users only (anon revoked in earlier migrations)
