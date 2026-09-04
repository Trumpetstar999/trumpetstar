-- Remove blanket PUBLIC execute rights on SECURITY DEFINER functions, then grant narrowly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_teacher_on_pro() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_stock(uuid, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_invoice(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_daily_usage(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_friends_star_ranking(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_star_ranking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_global_top_highscores(timestamp with time zone, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_toneforce_top_highscores(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_chat_creator(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_recording_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_recording_shared_with_me(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_chat_recording(text) FROM PUBLIC;

-- Internal / trigger-only functions: service role only
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_teacher_on_pro() TO service_role;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(integer) TO service_role;

-- Authenticated-only RPCs
GRANT EXECUTE ON FUNCTION public.add_stock(uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_invoice(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_friends_star_ranking(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_star_ranking() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_global_top_highscores(timestamp with time zone, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_toneforce_top_highscores(integer) TO authenticated, service_role;

-- RLS policy helper functions: required by policy evaluation for both roles
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_chat_creator(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_recording_owner(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_recording_shared_with_me(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_chat_recording(text) TO anon, authenticated, service_role;