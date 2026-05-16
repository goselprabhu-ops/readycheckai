
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS duration_target_seconds integer NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evaluations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technical_score integer,
  ADD COLUMN IF NOT EXISTS communication_score integer,
  ADD COLUMN IF NOT EXISTS confidence_score integer,
  ADD COLUMN IF NOT EXISTS overall_score integer,
  ADD COLUMN IF NOT EXISTS feedback jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.interview_messages
  ADD COLUMN IF NOT EXISTS question_key text,
  ADD COLUMN IF NOT EXISTS question_type text,
  ADD COLUMN IF NOT EXISTS evaluation jsonb,
  ADD COLUMN IF NOT EXISTS score integer;

CREATE INDEX IF NOT EXISTS interview_sessions_user_created_idx
  ON public.interview_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS interview_sessions_user_status_idx
  ON public.interview_sessions (user_id, status);
