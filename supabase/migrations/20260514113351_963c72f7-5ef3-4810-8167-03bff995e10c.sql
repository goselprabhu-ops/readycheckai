ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'rules',
  ADD COLUMN IF NOT EXISTS rule_key text;

CREATE UNIQUE INDEX IF NOT EXISTS recommendations_user_rule_key_idx
  ON public.recommendations(user_id, rule_key)
  WHERE rule_key IS NOT NULL;