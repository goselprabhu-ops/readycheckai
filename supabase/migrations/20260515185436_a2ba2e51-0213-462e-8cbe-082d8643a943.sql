
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_role text NOT NULL,
  focus text,
  weeks jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_heatmap jsonb NOT NULL DEFAULT '[]'::jsonb,
  projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  inputs_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_paths_user ON public.learning_paths(user_id, created_at DESC);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own paths select" ON public.learning_paths FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own paths insert" ON public.learning_paths FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own paths update" ON public.learning_paths FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own paths delete" ON public.learning_paths FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read paths" ON public.learning_paths FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.learning_path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, item_key)
);

CREATE INDEX idx_lpp_user ON public.learning_path_progress(user_id, path_id);

ALTER TABLE public.learning_path_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own progress all" ON public.learning_path_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_lpp_updated_at
  BEFORE UPDATE ON public.learning_path_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
