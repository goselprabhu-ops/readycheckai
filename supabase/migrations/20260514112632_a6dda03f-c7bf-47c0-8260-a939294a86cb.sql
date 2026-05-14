-- Readiness history: persisted snapshots of (SQL + Python + Resume) / 3
CREATE TABLE IF NOT EXISTS public.readiness_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sql_score INTEGER NOT NULL DEFAULT 0,
  python_score INTEGER NOT NULL DEFAULT 0,
  resume_score INTEGER NOT NULL DEFAULT 0,
  readiness INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'Beginner',
  weights JSONB NOT NULL DEFAULT '{"sql":1,"python":1,"resume":1}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_history_user_time
  ON public.readiness_history (user_id, computed_at DESC);

ALTER TABLE public.readiness_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own readiness select"
  ON public.readiness_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own readiness insert"
  ON public.readiness_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read readiness"
  ON public.readiness_history FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));