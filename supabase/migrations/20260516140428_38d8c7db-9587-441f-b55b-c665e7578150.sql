
-- =========================
-- ai_feedback table
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  surface text NOT NULL CHECK (surface IN ('resume','recommendation','interview','assessment','roadmap','other')),
  entity_id text,
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  quality_score smallint CHECK (quality_score BETWEEN 1 AND 5),
  issue_tag text,
  comment text,
  feature text,
  model text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_surface_created
  ON public.ai_feedback (surface, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_created
  ON public.ai_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_entity
  ON public.ai_feedback (surface, entity_id);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own feedback insert" ON public.ai_feedback;
CREATE POLICY "own feedback insert" ON public.ai_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own feedback select" ON public.ai_feedback;
CREATE POLICY "own feedback select" ON public.ai_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins read all ai_feedback" ON public.ai_feedback;
CREATE POLICY "admins read all ai_feedback" ON public.ai_feedback
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Light validation: trim long fields, enforce sane sizes
CREATE OR REPLACE FUNCTION public.validate_ai_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.comment IS NOT NULL AND length(NEW.comment) > 2000 THEN
    NEW.comment := substring(NEW.comment FROM 1 FOR 2000);
  END IF;
  IF NEW.issue_tag IS NOT NULL AND length(NEW.issue_tag) > 64 THEN
    RAISE EXCEPTION 'issue_tag too long';
  END IF;
  IF NEW.feature IS NOT NULL AND length(NEW.feature) > 64 THEN
    RAISE EXCEPTION 'feature too long';
  END IF;
  IF NEW.model IS NOT NULL AND length(NEW.model) > 128 THEN
    RAISE EXCEPTION 'model too long';
  END IF;
  IF NEW.entity_id IS NOT NULL AND length(NEW.entity_id) > 128 THEN
    RAISE EXCEPTION 'entity_id too long';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_ai_feedback() FROM public, anon;

DROP TRIGGER IF EXISTS trg_validate_ai_feedback ON public.ai_feedback;
CREATE TRIGGER trg_validate_ai_feedback
  BEFORE INSERT OR UPDATE ON public.ai_feedback
  FOR EACH ROW EXECUTE FUNCTION public.validate_ai_feedback();

-- =========================
-- Admin overview RPC
-- =========================
CREATE OR REPLACE FUNCTION public.ai_feedback_overview(_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  cutoff timestamptz := now() - make_interval(days => GREATEST(_days, 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH src AS (
    SELECT * FROM public.ai_feedback WHERE created_at >= cutoff
  ),
  by_surface AS (
    SELECT
      surface,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE rating = 1)::int AS up,
      COUNT(*) FILTER (WHERE rating = -1)::int AS down,
      ROUND(AVG(quality_score)::numeric, 2) AS avg_quality
    FROM src GROUP BY surface
  ),
  top_issues AS (
    SELECT
      surface,
      issue_tag,
      COUNT(*)::int AS count
    FROM src
    WHERE issue_tag IS NOT NULL AND issue_tag <> ''
    GROUP BY surface, issue_tag
  ),
  recent AS (
    SELECT id, surface, rating, issue_tag, comment, model, created_at
    FROM src
    WHERE comment IS NOT NULL AND length(trim(comment)) > 0
    ORDER BY created_at DESC
    LIMIT 25
  ),
  trend AS (
    SELECT
      date_trunc('day', created_at)::date AS day,
      surface,
      COUNT(*) FILTER (WHERE rating = 1)::int AS up,
      COUNT(*) FILTER (WHERE rating = -1)::int AS down
    FROM src GROUP BY 1, 2 ORDER BY 1
  )
  SELECT jsonb_build_object(
    'window_days', _days,
    'generated_at', now(),
    'by_surface', COALESCE((SELECT jsonb_agg(to_jsonb(by_surface) ORDER BY total DESC) FROM by_surface), '[]'::jsonb),
    'top_issues', COALESCE((SELECT jsonb_agg(to_jsonb(top_issues) ORDER BY count DESC) FROM top_issues), '[]'::jsonb),
    'recent_comments', COALESCE((SELECT jsonb_agg(to_jsonb(recent)) FROM recent), '[]'::jsonb),
    'trend', COALESCE((SELECT jsonb_agg(to_jsonb(trend)) FROM trend), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ai_feedback_overview(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ai_feedback_overview(int) TO authenticated;

-- =========================
-- Recommendation accuracy RPC
-- =========================
CREATE OR REPLACE FUNCTION public.recommendation_accuracy(_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  cutoff timestamptz := now() - make_interval(days => GREATEST(_days, 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH recs AS (
    SELECT
      COALESCE(source, 'unknown') AS source,
      COALESCE(category::text, 'uncategorized') AS category,
      status,
      id::text AS rec_id
    FROM public.recommendations
    WHERE created_at >= cutoff
  ),
  by_source AS (
    SELECT
      source,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status IN ('accepted','done','completed'))::int AS accepted,
      COUNT(*) FILTER (WHERE status IN ('dismissed','rejected'))::int AS dismissed
    FROM recs GROUP BY source
  ),
  fb AS (
    SELECT entity_id, rating
    FROM public.ai_feedback
    WHERE surface = 'recommendation' AND created_at >= cutoff
  ),
  fb_join AS (
    SELECT r.source, r.category, f.rating
    FROM recs r JOIN fb f ON f.entity_id = r.rec_id
  ),
  by_source_fb AS (
    SELECT
      source,
      COUNT(*)::int AS feedback_total,
      COUNT(*) FILTER (WHERE rating = 1)::int AS feedback_up,
      COUNT(*) FILTER (WHERE rating = -1)::int AS feedback_down
    FROM fb_join GROUP BY source
  )
  SELECT jsonb_build_object(
    'window_days', _days,
    'generated_at', now(),
    'by_source', COALESCE((SELECT jsonb_agg(to_jsonb(by_source) ORDER BY total DESC) FROM by_source), '[]'::jsonb),
    'feedback_by_source', COALESCE((SELECT jsonb_agg(to_jsonb(by_source_fb)) FROM by_source_fb), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.recommendation_accuracy(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.recommendation_accuracy(int) TO authenticated;
