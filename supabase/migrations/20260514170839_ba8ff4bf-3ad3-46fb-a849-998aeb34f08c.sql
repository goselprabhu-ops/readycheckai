-- 1. SKILLS: dedupe, then add UNIQUE(user_id, name)
WITH ranked AS (
  SELECT id, user_id, name, level, updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, lower(name)
      ORDER BY level DESC, updated_at DESC
    ) AS rn
  FROM public.skills
),
keepers AS (
  SELECT id FROM ranked WHERE rn = 1
),
maxes AS (
  SELECT user_id, lower(name) AS lname, MAX(level) AS max_level, MAX(updated_at) AS max_updated
  FROM public.skills GROUP BY user_id, lower(name)
)
UPDATE public.skills s
SET level = m.max_level, updated_at = m.max_updated
FROM maxes m
WHERE s.id IN (SELECT id FROM keepers)
  AND s.user_id = m.user_id
  AND lower(s.name) = m.lname;

DELETE FROM public.skills s
USING (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, lower(name)
      ORDER BY level DESC, updated_at DESC
    ) AS rn FROM public.skills
  ) r WHERE r.rn > 1
) dup
WHERE s.id = dup.id;

-- normalize names so future upserts hit the same key
UPDATE public.skills SET name = btrim(name) WHERE name <> btrim(name);

ALTER TABLE public.skills
  ADD CONSTRAINT skills_user_name_unique UNIQUE (user_id, name);

-- 2. FOREIGN KEYS between public tables (no FKs to auth.users per project rules)
-- Clean orphans first so FK creation succeeds.
DELETE FROM public.questions
  WHERE assessment_id IS NOT NULL
    AND assessment_id NOT IN (SELECT id FROM public.assessment_definitions);
DELETE FROM public.assessment_attempts
  WHERE assessment_id NOT IN (SELECT id FROM public.assessment_definitions);
DELETE FROM public.scores
  WHERE attempt_id NOT IN (SELECT id FROM public.assessment_attempts)
     OR question_id NOT IN (SELECT id FROM public.questions);
DELETE FROM public.resume_analyses
  WHERE resume_id IS NOT NULL
    AND resume_id NOT IN (SELECT id FROM public.resumes);
DELETE FROM public.recommendations
  WHERE attempt_id IS NOT NULL
    AND attempt_id NOT IN (SELECT id FROM public.assessment_attempts);

ALTER TABLE public.questions
  ADD CONSTRAINT questions_assessment_fk
  FOREIGN KEY (assessment_id) REFERENCES public.assessment_definitions(id) ON DELETE CASCADE;

ALTER TABLE public.assessment_attempts
  ADD CONSTRAINT assessment_attempts_assessment_fk
  FOREIGN KEY (assessment_id) REFERENCES public.assessment_definitions(id) ON DELETE CASCADE;

ALTER TABLE public.scores
  ADD CONSTRAINT scores_attempt_fk
  FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;

ALTER TABLE public.scores
  ADD CONSTRAINT scores_question_fk
  FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

ALTER TABLE public.resume_analyses
  ADD CONSTRAINT resume_analyses_resume_fk
  FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;

ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_attempt_fk
  FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE SET NULL;

-- 3. COMPOSITE INDEXES on hot query paths
CREATE INDEX IF NOT EXISTS assessment_attempts_user_completed_idx
  ON public.assessment_attempts (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS scores_attempt_idx
  ON public.scores (attempt_id);
CREATE INDEX IF NOT EXISTS scores_user_created_idx
  ON public.scores (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS readiness_history_user_computed_idx
  ON public.readiness_history (user_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS recommendations_user_status_created_idx
  ON public.recommendations (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS skills_user_idx
  ON public.skills (user_id);
CREATE INDEX IF NOT EXISTS questions_assessment_idx
  ON public.questions (assessment_id, order_index);
CREATE INDEX IF NOT EXISTS resume_analyses_user_created_idx
  ON public.resume_analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS assessments_user_created_idx
  ON public.assessments (user_id, created_at DESC);

-- 4. Partial unique: only one open attempt per (user, assessment)
CREATE UNIQUE INDEX IF NOT EXISTS assessment_attempts_open_unique
  ON public.assessment_attempts (user_id, assessment_id)
  WHERE completed_at IS NULL;