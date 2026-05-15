-- 1. Skills: dedupe (case-insensitive), keep max level
WITH ranked AS (
  SELECT id, user_id, name, level, updated_at,
         row_number() OVER (
           PARTITION BY user_id, lower(trim(name))
           ORDER BY level DESC, updated_at DESC NULLS LAST, id
         ) AS rn,
         max(level) OVER (PARTITION BY user_id, lower(trim(name))) AS max_level
  FROM public.skills
)
UPDATE public.skills s
SET level = r.max_level
FROM ranked r
WHERE s.id = r.id AND r.rn = 1 AND s.level <> r.max_level;

DELETE FROM public.skills s
USING (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY user_id, lower(trim(name))
             ORDER BY level DESC, updated_at DESC NULLS LAST, id
           ) AS rn
    FROM public.skills
  ) x WHERE rn > 1
) dup
WHERE s.id = dup.id;

UPDATE public.skills SET name = trim(name) WHERE name <> trim(name);

CREATE UNIQUE INDEX IF NOT EXISTS skills_user_lower_name_uidx
  ON public.skills (user_id, lower(name));

-- 2. Recommendations lifecycle + status CHECK
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS generated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at   timestamptz;

UPDATE public.recommendations
SET status = 'pending'
WHERE status IS NULL
   OR status NOT IN ('pending','in_progress','completed','dismissed','expired');

ALTER TABLE public.recommendations
  DROP CONSTRAINT IF EXISTS recommendations_status_check;
ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_status_check
  CHECK (status IN ('pending','in_progress','completed','dismissed','expired'));

CREATE INDEX IF NOT EXISTS recommendations_user_expires_idx
  ON public.recommendations (user_id, expires_at)
  WHERE expires_at IS NOT NULL;

-- 3. assessment_attempts status CHECK
UPDATE public.assessment_attempts
SET status = CASE WHEN completed_at IS NOT NULL THEN 'submitted' ELSE 'in_progress' END
WHERE status IS NULL
   OR status NOT IN ('in_progress','submitted','expired','abandoned');

ALTER TABLE public.assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_status_check;
ALTER TABLE public.assessment_attempts
  ADD CONSTRAINT assessment_attempts_status_check
  CHECK (status IN ('in_progress','submitted','expired','abandoned'));

-- 4. resume_analyses.method CHECK
UPDATE public.resume_analyses
SET method = 'ai'
WHERE method IS NULL OR method NOT IN ('ai','rules');

ALTER TABLE public.resume_analyses
  DROP CONSTRAINT IF EXISTS resume_analyses_method_check;
ALTER TABLE public.resume_analyses
  ADD CONSTRAINT resume_analyses_method_check
  CHECK (method IN ('ai','rules'));

-- 5. Score / range sanity (clamp existing data first to satisfy CHECK)
UPDATE public.readiness_history
SET sql_score    = greatest(0, least(100, sql_score)),
    python_score = greatest(0, least(100, python_score)),
    resume_score = greatest(0, least(100, resume_score)),
    readiness    = greatest(0, least(100, readiness));

UPDATE public.resume_analyses
SET ats_score = greatest(0, least(100, ats_score));

UPDATE public.assessment_attempts
SET total_score = greatest(0, total_score),
    max_score   = greatest(total_score, max_score);

ALTER TABLE public.scores
  DROP CONSTRAINT IF EXISTS scores_points_nonneg;
ALTER TABLE public.scores
  ADD CONSTRAINT scores_points_nonneg CHECK (points_awarded >= 0);

ALTER TABLE public.assessment_attempts
  DROP CONSTRAINT IF EXISTS attempts_score_bounds;
ALTER TABLE public.assessment_attempts
  ADD CONSTRAINT attempts_score_bounds
  CHECK (total_score >= 0 AND max_score >= 0 AND total_score <= max_score);

ALTER TABLE public.readiness_history
  DROP CONSTRAINT IF EXISTS readiness_score_bounds;
ALTER TABLE public.readiness_history
  ADD CONSTRAINT readiness_score_bounds
  CHECK (sql_score BETWEEN 0 AND 100
         AND python_score BETWEEN 0 AND 100
         AND resume_score BETWEEN 0 AND 100
         AND readiness BETWEEN 0 AND 100);

ALTER TABLE public.resume_analyses
  DROP CONSTRAINT IF EXISTS resume_ats_score_bounds;
ALTER TABLE public.resume_analyses
  ADD CONSTRAINT resume_ats_score_bounds
  CHECK (ats_score BETWEEN 0 AND 100);

-- 6. Cleanup: orphans / dead snapshots
DELETE FROM public.recommendations
WHERE status = 'pending'
  AND attempt_id IS NULL
  AND rule_key IS NULL
  AND created_at < now() - interval '90 days';

DELETE FROM public.readiness_history
WHERE readiness = 0 AND sql_score = 0 AND python_score = 0 AND resume_score = 0
  AND computed_at < now() - interval '30 days';

UPDATE public.recommendations
SET status = 'expired'
WHERE status = 'pending'
  AND created_at < now() - interval '60 days';