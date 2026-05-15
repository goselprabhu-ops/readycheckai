ALTER TABLE public.resume_analyses
  ADD COLUMN method text NOT NULL DEFAULT 'ai'
    CHECK (method IN ('ai', 'rules'));

CREATE INDEX IF NOT EXISTS resume_analyses_user_created_idx
  ON public.resume_analyses (user_id, created_at DESC);