-- Lock down increment_ai_usage:
--  * derive user_id from auth.uid() (ignore caller-supplied param)
--  * derive hard_cap from internal mapping (ignore caller-supplied param)
--  * only the server (service_role) may call it; revoke from PUBLIC/authenticated

CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  _user_id uuid,        -- accepted for back-compat; IGNORED
  _feature text,
  _hard_cap integer     -- accepted for back-compat; IGNORED
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date := (now() AT TIME ZONE 'utc')::date;
  _new_count integer;
  _uid uuid := auth.uid();
  _cap integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'invalid_authorization_specification';
  END IF;

  -- Server-controlled cap table (must match src/lib/ai-guardrails.ts)
  _cap := CASE _feature
    WHEN 'resume_ai'      THEN 10
    WHEN 'interview'      THEN 60
    WHEN 'assessment_gen' THEN 20
    ELSE 0
  END;

  IF _cap = 0 THEN
    RAISE EXCEPTION 'unknown_ai_feature' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.ai_usage_daily (user_id, day, feature, count)
  VALUES (_uid, _today, _feature, 1)
  ON CONFLICT (user_id, day, feature)
  DO UPDATE SET count = ai_usage_daily.count + 1,
                updated_at = now()
  RETURNING count INTO _new_count;

  IF _new_count > _cap THEN
    RAISE EXCEPTION 'ai_usage_limit_exceeded' USING ERRCODE = 'check_violation';
  END IF;

  RETURN _new_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, integer) TO service_role;