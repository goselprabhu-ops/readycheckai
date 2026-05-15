-- 1. Secrets table (service_role only)
CREATE TABLE IF NOT EXISTS public.question_secrets (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_answer text NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.question_secrets ENABLE ROW LEVEL SECURITY;

-- No policies → only service_role bypasses RLS and can access.
-- Explicitly revoke from anon/authenticated for clarity.
REVOKE ALL ON public.question_secrets FROM anon, authenticated;

-- 2. Backfill from existing questions table
INSERT INTO public.question_secrets (question_id, correct_answer, explanation)
SELECT id, correct_answer, explanation
FROM public.questions
ON CONFLICT (question_id) DO NOTHING;

-- 3. Drop secret columns from questions (now safe — only sanitized fields remain)
ALTER TABLE public.questions DROP COLUMN IF EXISTS correct_answer;
ALTER TABLE public.questions DROP COLUMN IF EXISTS explanation;

-- 4. Public view: sanitized question shape for clients
CREATE OR REPLACE VIEW public.questions_public
WITH (security_invoker = true) AS
SELECT id, assessment_id, prompt, options, points, order_index, created_at
FROM public.questions;

GRANT SELECT ON public.questions_public TO anon, authenticated;

-- 5. Trigger to keep updated_at fresh on secrets
DROP TRIGGER IF EXISTS set_question_secrets_updated_at ON public.question_secrets;
CREATE TRIGGER set_question_secrets_updated_at
BEFORE UPDATE ON public.question_secrets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();