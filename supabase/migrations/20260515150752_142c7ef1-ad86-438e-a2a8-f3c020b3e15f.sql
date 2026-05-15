ALTER TABLE public.target_roles
  ADD COLUMN IF NOT EXISTS skill_weights jsonb NOT NULL DEFAULT '{"sql":0.35,"python":0.35,"resume":0.30}'::jsonb,
  ADD COLUMN IF NOT EXISTS benchmark_ranges jsonb NOT NULL DEFAULT
    '{"beginner":[0,49],"intermediate":[50,69],"interview_ready":[70,84],"advanced":[85,100]}'::jsonb;

UPDATE public.target_roles SET skill_weights = '{"sql":0.40,"python":0.30,"resume":0.30}'::jsonb WHERE slug = 'data-analyst';
UPDATE public.target_roles SET skill_weights = '{"sql":0.35,"python":0.40,"resume":0.25}'::jsonb WHERE slug = 'data-engineer';
UPDATE public.target_roles SET skill_weights = '{"sql":0.20,"python":0.50,"resume":0.30}'::jsonb WHERE slug = 'ml-engineer';
UPDATE public.target_roles SET skill_weights = '{"sql":0.25,"python":0.45,"resume":0.30}'::jsonb WHERE slug = 'backend-developer';
UPDATE public.target_roles SET skill_weights = '{"sql":0.15,"python":0.40,"resume":0.45}'::jsonb WHERE slug = 'devops-engineer';

-- Validate weights sum ~ 1.0 (allow small float tolerance)
ALTER TABLE public.target_roles
  DROP CONSTRAINT IF EXISTS target_roles_weights_sum_check;
ALTER TABLE public.target_roles
  ADD CONSTRAINT target_roles_weights_sum_check CHECK (
    abs(
      coalesce((skill_weights->>'sql')::numeric, 0) +
      coalesce((skill_weights->>'python')::numeric, 0) +
      coalesce((skill_weights->>'resume')::numeric, 0) - 1
    ) < 0.05
  );