
-- =========================================================
-- security_events: audit log for suspicious / sensitive activity
-- =========================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warn','error','critical')),
  ip_address text,
  user_agent text,
  route text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS security_events_user_created_idx
  ON public.security_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_created_idx
  ON public.security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_severity_idx
  ON public.security_events (severity, created_at DESC)
  WHERE severity IN ('error','critical');

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read security_events" ON public.security_events;
CREATE POLICY "admins read security_events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies => only service_role can write directly.

-- SECURITY DEFINER RPC for server-side logging from authenticated contexts.
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _severity text DEFAULT 'info',
  _metadata jsonb DEFAULT '{}'::jsonb,
  _route text DEFAULT NULL,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF _severity NOT IN ('info','warn','error','critical') THEN
    _severity := 'info';
  END IF;
  INSERT INTO public.security_events
    (user_id, event_type, severity, ip_address, user_agent, route, metadata)
  VALUES
    (_uid, _event_type, _severity, _ip, _user_agent, _route, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text,text,jsonb,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_security_event(text,text,jsonb,text,text,text)
  TO authenticated, service_role;

-- =========================================================
-- check_action_cooldown: sliding-window per-user action cooldown
-- =========================================================
-- Uses security_events as the canonical log. Returns seconds remaining
-- until the user may perform `_action` again, or 0 if allowed now.
-- When allowed, records a 'cooldown_consumed' event so the next call sees it.
CREATE OR REPLACE FUNCTION public.check_action_cooldown(
  _action text,
  _cooldown_seconds integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _last timestamptz;
  _remaining integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'invalid_authorization_specification';
  END IF;
  IF _cooldown_seconds <= 0 THEN
    RETURN 0;
  END IF;

  SELECT MAX(created_at) INTO _last
  FROM public.security_events
  WHERE user_id = _uid
    AND event_type = 'cooldown_consumed'
    AND metadata->>'action' = _action
    AND created_at > now() - make_interval(secs => _cooldown_seconds);

  IF _last IS NOT NULL THEN
    _remaining := GREATEST(
      0,
      _cooldown_seconds - EXTRACT(EPOCH FROM (now() - _last))::int
    );
    IF _remaining > 0 THEN
      RETURN _remaining;
    END IF;
  END IF;

  INSERT INTO public.security_events (user_id, event_type, severity, metadata)
  VALUES (_uid, 'cooldown_consumed', 'info',
          jsonb_build_object('action', _action, 'cooldown_seconds', _cooldown_seconds));
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_action_cooldown(text,integer) FROM public;
GRANT EXECUTE ON FUNCTION public.check_action_cooldown(text,integer)
  TO authenticated, service_role;

-- =========================================================
-- Harden question_secrets: service-role only
-- =========================================================
ALTER TABLE public.question_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny authenticated question_secrets" ON public.question_secrets;
-- Explicit deny for anon/authenticated. Service role bypasses RLS.
CREATE POLICY "deny authenticated question_secrets"
  ON public.question_secrets
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- =========================================================
-- Harden email tables: deny anon/authenticated explicitly
-- =========================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'email_send_log','email_send_state','email_unsubscribe_tokens','suppressed_emails'
  ]) LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "deny non-service %1$s" ON public.%1$I;', t
    );
    EXECUTE format(
      'CREATE POLICY "deny non-service %1$s" ON public.%1$I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
      t
    );
  END LOOP;
END $$;

-- =========================================================
-- Restrict `resumes` storage bucket: owner-prefixed paths only
-- =========================================================
-- Path convention: <user_id>/<filename>
DROP POLICY IF EXISTS "resumes owner read" ON storage.objects;
DROP POLICY IF EXISTS "resumes owner insert" ON storage.objects;
DROP POLICY IF EXISTS "resumes owner update" ON storage.objects;
DROP POLICY IF EXISTS "resumes owner delete" ON storage.objects;

CREATE POLICY "resumes owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resumes owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resumes owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resumes owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
