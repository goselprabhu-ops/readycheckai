
-- Per-user daily AI usage counters for soft/hard caps
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  feature text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day, feature)
);

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai usage select"
  ON public.ai_usage_daily FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins read ai usage"
  ON public.ai_usage_daily FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_day ON public.ai_usage_daily(user_id, day);

-- Atomic increment + cap check. Returns the new count after increment, or
-- raises 'ai_usage_limit_exceeded' if the hard cap would be exceeded.
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  _user_id uuid,
  _feature text,
  _hard_cap integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'utc')::date;
  _new_count integer;
BEGIN
  INSERT INTO public.ai_usage_daily (user_id, day, feature, count)
  VALUES (_user_id, _today, _feature, 1)
  ON CONFLICT (user_id, day, feature)
  DO UPDATE SET count = ai_usage_daily.count + 1,
                updated_at = now()
  RETURNING count INTO _new_count;

  IF _new_count > _hard_cap THEN
    RAISE EXCEPTION 'ai_usage_limit_exceeded' USING ERRCODE = 'check_violation';
  END IF;

  RETURN _new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, integer) TO authenticated;
