-- Indexes for product analytics over platform_events
CREATE INDEX IF NOT EXISTS idx_platform_events_created_at
  ON public.platform_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_event_created
  ON public.platform_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_user_created
  ON public.platform_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_events_session_created
  ON public.platform_events (session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_events_route
  ON public.platform_events (route, created_at DESC) WHERE route IS NOT NULL;

-- Product intelligence aggregator (admin-only)
CREATE OR REPLACE FUNCTION public.product_intelligence(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _since timestamptz := now() - make_interval(days => GREATEST(_days, 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH users_in_window AS (
    SELECT id, created_at FROM auth.users WHERE created_at >= _since
  ),
  signups AS (SELECT count(*)::int c FROM users_in_window),
  onboarded AS (
    SELECT count(*)::int c FROM public.profiles p
    JOIN users_in_window u ON u.id = p.id
    WHERE p.onboarded = true
  ),
  resumed AS (
    SELECT count(DISTINCT r.user_id)::int c FROM public.resumes r
    JOIN users_in_window u ON u.id = r.user_id
  ),
  assessed AS (
    SELECT count(DISTINCT a.user_id)::int c FROM public.assessment_attempts a
    JOIN users_in_window u ON u.id = a.user_id
    WHERE a.status IN ('submitted','expired')
  ),
  interviewed AS (
    SELECT count(DISTINCT i.user_id)::int c FROM public.interview_sessions i
    JOIN users_in_window u ON u.id = i.user_id
    WHERE i.status = 'completed' OR i.ended_at IS NOT NULL
  ),
  upgraded AS (
    SELECT count(DISTINCT s.user_id)::int c FROM public.subscriptions s
    JOIN users_in_window u ON u.id = s.user_id
    WHERE s.status IN ('active','trialing')
  ),
  feat_heatmap AS (
    SELECT event_name, count(*)::int total,
           count(DISTINCT user_id)::int unique_users
    FROM public.platform_events
    WHERE created_at >= _since
    GROUP BY event_name
    ORDER BY total DESC
    LIMIT 25
  ),
  daily_active AS (
    SELECT date_trunc('day', created_at)::date d, count(DISTINCT user_id)::int dau
    FROM public.platform_events
    WHERE created_at >= _since AND user_id IS NOT NULL
    GROUP BY 1 ORDER BY 1
  ),
  -- Retention cohort by signup week
  cohort_base AS (
    SELECT id AS user_id,
           date_trunc('week', created_at)::date AS cohort_week,
           created_at AS signup_at
    FROM auth.users
    WHERE created_at >= now() - interval '60 days'
  ),
  cohort_activity AS (
    SELECT c.cohort_week, c.user_id,
           bool_or(pe.created_at BETWEEN c.signup_at + interval '1 day'  AND c.signup_at + interval '2 days')  AS d1,
           bool_or(pe.created_at BETWEEN c.signup_at + interval '7 days' AND c.signup_at + interval '8 days')  AS d7,
           bool_or(pe.created_at BETWEEN c.signup_at + interval '30 days' AND c.signup_at + interval '31 days') AS d30
    FROM cohort_base c
    LEFT JOIN public.platform_events pe ON pe.user_id = c.user_id
    GROUP BY 1, 2
  ),
  cohort_summary AS (
    SELECT cohort_week,
           count(*)::int users,
           count(*) FILTER (WHERE d1)::int  d1_count,
           count(*) FILTER (WHERE d7)::int  d7_count,
           count(*) FILTER (WHERE d30)::int d30_count
    FROM cohort_activity GROUP BY 1 ORDER BY 1
  ),
  dropoff AS (
    SELECT
      (SELECT c FROM signups)     AS signups,
      (SELECT c FROM onboarded)   AS onboarded,
      (SELECT c FROM resumed)     AS resumed,
      (SELECT c FROM assessed)    AS assessed,
      (SELECT c FROM interviewed) AS interviewed,
      (SELECT c FROM upgraded)    AS upgraded
  )
  SELECT jsonb_build_object(
    'window_days', _days,
    'computed_at', now(),
    'funnel', (SELECT to_jsonb(dropoff) FROM dropoff),
    'feature_heatmap', (
      SELECT coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) FROM feat_heatmap f
    ),
    'daily_active', (
      SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) FROM daily_active d
    ),
    'cohorts', (
      SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) FROM cohort_summary c
    ),
    'engagement', (
      SELECT jsonb_build_object(
        'events_24h',  (SELECT count(*)::int FROM public.platform_events WHERE created_at > now() - interval '24 hours'),
        'events_window', (SELECT count(*)::int FROM public.platform_events WHERE created_at >= _since),
        'dau',         (SELECT count(DISTINCT user_id)::int FROM public.platform_events WHERE created_at > now() - interval '24 hours' AND user_id IS NOT NULL),
        'wau',         (SELECT count(DISTINCT user_id)::int FROM public.platform_events WHERE created_at > now() - interval '7 days'   AND user_id IS NOT NULL),
        'mau',         (SELECT count(DISTINCT user_id)::int FROM public.platform_events WHERE created_at > now() - interval '30 days'  AND user_id IS NOT NULL),
        'sessions_24h',(SELECT count(DISTINCT session_id)::int FROM public.platform_events WHERE created_at > now() - interval '24 hours' AND session_id IS NOT NULL)
      )
    ),
    'top_routes', (
      SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) FROM (
        SELECT route, count(*)::int views, count(DISTINCT user_id)::int users
        FROM public.platform_events
        WHERE created_at >= _since AND route IS NOT NULL AND event_name = 'page_view'
        GROUP BY 1 ORDER BY views DESC LIMIT 20
      ) r
    ),
    'dropoff_pages', (
      SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) FROM (
        SELECT route, count(*)::int exits
        FROM public.platform_events
        WHERE created_at >= _since AND event_name = 'session_exit' AND route IS NOT NULL
        GROUP BY 1 ORDER BY exits DESC LIMIT 15
      ) r
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.product_intelligence(integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.product_intelligence(integer) TO authenticated;