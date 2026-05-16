
-- Difficulty + topic on questions (for adaptive selection and topic-wise scoring)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy','medium','hard')),
  ADD COLUMN IF NOT EXISTS topic text;

CREATE INDEX IF NOT EXISTS idx_questions_assessment_difficulty
  ON public.questions(assessment_id, difficulty);

-- Recreate sanitized public view (drop first because column set is changing)
DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public
WITH (security_invoker = true)
AS
SELECT id, assessment_id, prompt, options, points, order_index, difficulty, topic
FROM public.questions;

GRANT SELECT ON public.questions_public TO authenticated;

-- Difficulty selected for the attempt
ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'adaptive'
    CHECK (difficulty IN ('easy','medium','hard','mixed','adaptive'));

-- Leaderboard (masked names) — SECURITY DEFINER so it can read profiles + attempts safely
CREATE OR REPLACE FUNCTION public.get_assessment_leaderboard(
  _assessment_id uuid,
  _limit int DEFAULT 25
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  best_score int,
  best_max int,
  best_pct numeric,
  attempts_count int,
  last_attempt_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      a.user_id,
      a.total_score,
      a.max_score,
      CASE WHEN a.max_score > 0
        THEN ROUND((a.total_score::numeric / a.max_score) * 100, 1)
        ELSE 0 END AS pct,
      a.completed_at
    FROM public.assessment_attempts a
    WHERE a.assessment_id = _assessment_id
      AND a.status IN ('submitted','expired')
      AND a.completed_at IS NOT NULL
  ),
  agg AS (
    SELECT
      user_id,
      MAX(pct) AS best_pct,
      (ARRAY_AGG(total_score ORDER BY pct DESC, completed_at DESC))[1] AS best_score,
      (ARRAY_AGG(max_score ORDER BY pct DESC, completed_at DESC))[1] AS best_max,
      COUNT(*)::int AS attempts_count,
      MAX(completed_at) AS last_attempt_at
    FROM ranked
    GROUP BY user_id
  )
  SELECT
    g.user_id,
    COALESCE(
      NULLIF(LEFT(p.full_name, 1) || REPEAT('•', GREATEST(LENGTH(COALESCE(p.full_name,'')) - 2, 1)) || RIGHT(p.full_name, 1), ''),
      'Anonymous'
    ) AS display_name,
    g.best_score,
    g.best_max,
    g.best_pct,
    g.attempts_count,
    g.last_attempt_at
  FROM agg g
  LEFT JOIN public.profiles p ON p.id = g.user_id
  ORDER BY g.best_pct DESC, g.last_attempt_at ASC
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_assessment_leaderboard(uuid, int) TO authenticated;
