-- Internal-only helpers: triggers, cron, queue, definer-only callers.
-- Revoke EXECUTE from every client role; only postgres/service_role retain access.
revoke execute on function public.handle_new_user()                       from public, anon, authenticated;
revoke execute on function public.set_updated_at()                        from public, anon, authenticated;
revoke execute on function public.validate_readiness_score()              from public, anon, authenticated;
revoke execute on function public.enqueue_email(text, jsonb)              from public, anon, authenticated;
revoke execute on function public.delete_email(text, bigint)              from public, anon, authenticated;
revoke execute on function public.read_email_batch(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.move_to_dlq(text, text, bigint, jsonb)  from public, anon, authenticated;
revoke execute on function public.log_system_event(text, text, text, text, text, integer, jsonb)
                                                                          from public, anon, authenticated;
revoke execute on function public.prune_failed_resume_analyses(integer)   from public, anon, authenticated;
revoke execute on function public.prune_ai_response_cache()               from public, anon, authenticated;
revoke execute on function public.is_institution_member(uuid, uuid)       from public, anon, authenticated;
revoke execute on function public.has_institution_role(uuid, uuid, institution_role[])
                                                                          from public, anon, authenticated;

-- RLS helper: only needed by the planner under authenticated context.
revoke execute on function public.has_role(uuid, app_role) from public, anon;
grant  execute on function public.has_role(uuid, app_role) to   authenticated;

-- Client-callable RPCs: restrict to the smallest role that needs them.

-- Public profile page is reachable while logged out.
revoke execute on function public.get_public_profile(text) from public;
grant  execute on function public.get_public_profile(text) to   anon, authenticated;

-- Signed-in user surface area.
revoke execute on function public.has_active_subscription(uuid, text)        from public, anon;
grant  execute on function public.has_active_subscription(uuid, text)        to   authenticated;

revoke execute on function public.increment_ai_usage(uuid, text, integer)    from public, anon;
grant  execute on function public.increment_ai_usage(uuid, text, integer)    to   authenticated;

revoke execute on function public.log_security_event(text, text, jsonb, text, text, text)
                                                                             from public, anon;
grant  execute on function public.log_security_event(text, text, jsonb, text, text, text)
                                                                             to   authenticated;

revoke execute on function public.check_action_cooldown(text, integer)       from public, anon;
grant  execute on function public.check_action_cooldown(text, integer)       to   authenticated;

revoke execute on function public.get_assessment_leaderboard(uuid, integer)  from public, anon;
grant  execute on function public.get_assessment_leaderboard(uuid, integer)  to   authenticated;

revoke execute on function public.institution_dashboard(uuid, text, uuid, integer, integer)
                                                                             from public, anon;
grant  execute on function public.institution_dashboard(uuid, text, uuid, integer, integer)
                                                                             to   authenticated;

-- Admin-only RPC (function itself also re-checks the admin role).
revoke execute on function public.system_health_summary() from public, anon;
grant  execute on function public.system_health_summary() to   authenticated;