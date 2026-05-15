ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','submitted','expired'));

-- Backfill expires_at: existing attempts get started_at + 10min as a safe default
UPDATE public.assessment_attempts
SET expires_at = started_at + interval '10 minutes'
WHERE expires_at IS NULL;

-- Backfill status from completed_at
UPDATE public.assessment_attempts
SET status = 'submitted'
WHERE completed_at IS NOT NULL AND status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_assessment
  ON public.assessment_attempts(user_id, assessment_id, started_at DESC);