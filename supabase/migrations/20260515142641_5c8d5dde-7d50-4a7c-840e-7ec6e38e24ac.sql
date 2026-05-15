-- Sprint 1 #4: DB hardening (retry — drop duplicate UNIQUE as constraint)

-- 1) Orphan cleanup before adding FKs
DELETE FROM public.assessment_attempts a WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.user_id);
DELETE FROM public.scores s WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);
DELETE FROM public.phone_otps p WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id);
DELETE FROM public.readiness_history r WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);
DELETE FROM public.recommendations r WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);
DELETE FROM public.ai_usage_daily a WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.user_id);

-- 2) Missing FKs to auth.users (ON DELETE CASCADE)
ALTER TABLE public.assessment_attempts
  ADD CONSTRAINT assessment_attempts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.scores
  ADD CONSTRAINT scores_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.phone_otps
  ADD CONSTRAINT phone_otps_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.readiness_history
  ADD CONSTRAINT readiness_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_usage_daily
  ADD CONSTRAINT ai_usage_daily_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3) Drop duplicate FK constraints
ALTER TABLE public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_assessment_fk;
ALTER TABLE public.questions           DROP CONSTRAINT IF EXISTS questions_assessment_fk;
ALTER TABLE public.recommendations     DROP CONSTRAINT IF EXISTS recommendations_attempt_fk;
ALTER TABLE public.resume_analyses     DROP CONSTRAINT IF EXISTS resume_analyses_resume_fk;
ALTER TABLE public.scores              DROP CONSTRAINT IF EXISTS scores_attempt_fk;
ALTER TABLE public.scores              DROP CONSTRAINT IF EXISTS scores_question_fk;

-- 4) Drop duplicate UNIQUE constraint on skills (drop as constraint, not index)
ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS skills_user_name_unique;

-- 5) Drop duplicate plain indexes
DROP INDEX IF EXISTS public.scores_attempt_idx;
DROP INDEX IF EXISTS public.readiness_history_user_computed_idx;
DROP INDEX IF EXISTS public.idx_questions_assessment;

-- 6) Hot-path index for phone OTP active lookups
CREATE INDEX IF NOT EXISTS phone_otps_user_active_idx
  ON public.phone_otps (user_id, expires_at DESC)
  WHERE consumed_at IS NULL;