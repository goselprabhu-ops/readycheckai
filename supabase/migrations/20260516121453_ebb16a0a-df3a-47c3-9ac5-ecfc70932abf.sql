
ALTER TABLE public.target_roles
  ADD COLUMN IF NOT EXISTS dimension_weights jsonb NOT NULL DEFAULT
    '{"sql":0.2,"python":0.2,"statistics":0.15,"visualization":0.15,"communication":0.15,"business":0.15}'::jsonb,
  ADD COLUMN IF NOT EXISTS pathway jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Upsert V1 analytics roles
INSERT INTO public.target_roles (slug, name, description, skill_weights, benchmark_ranges, dimension_weights, pathway, is_active)
VALUES
  ('data-analyst', 'Data Analyst',
   'SQL, dashboards, and storytelling with data.',
   '{"sql":0.40,"python":0.30,"resume":0.30}'::jsonb,
   '{"beginner":[0,49],"intermediate":[50,69],"interview_ready":[70,84],"advanced":[85,100]}'::jsonb,
   '{"sql":0.25,"python":0.15,"statistics":0.15,"visualization":0.20,"communication":0.10,"business":0.15}'::jsonb,
   '["Junior Data Analyst","Data Analyst","Senior Data Analyst","Analytics Lead"]'::jsonb,
   true),
  ('business-analyst', 'Business Analyst',
   'Requirements, stakeholder workflows, and business modeling.',
   '{"sql":0.30,"python":0.15,"resume":0.55}'::jsonb,
   '{"beginner":[0,49],"intermediate":[50,69],"interview_ready":[70,84],"advanced":[85,100]}'::jsonb,
   '{"sql":0.15,"python":0.05,"statistics":0.10,"visualization":0.20,"communication":0.25,"business":0.25}'::jsonb,
   '["Business Analyst Intern","Business Analyst","Senior Business Analyst","Product Manager"]'::jsonb,
   true),
  ('bi-analyst', 'BI Analyst',
   'Power BI / Tableau, dimensional modeling, and KPIs.',
   '{"sql":0.40,"python":0.10,"resume":0.50}'::jsonb,
   '{"beginner":[0,49],"intermediate":[50,69],"interview_ready":[70,84],"advanced":[85,100]}'::jsonb,
   '{"sql":0.25,"python":0.05,"statistics":0.10,"visualization":0.30,"communication":0.15,"business":0.15}'::jsonb,
   '["BI Developer","BI Analyst","Senior BI Analyst","BI Architect"]'::jsonb,
   true),
  ('jr-data-scientist', 'Junior Data Scientist',
   'Python, statistics, ML fundamentals, and experimentation.',
   '{"sql":0.25,"python":0.45,"resume":0.30}'::jsonb,
   '{"beginner":[0,49],"intermediate":[50,69],"interview_ready":[70,84],"advanced":[85,100]}'::jsonb,
   '{"sql":0.15,"python":0.25,"statistics":0.25,"visualization":0.10,"communication":0.10,"business":0.15}'::jsonb,
   '["Data Science Intern","Junior Data Scientist","Data Scientist","Senior Data Scientist"]'::jsonb,
   true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  skill_weights = EXCLUDED.skill_weights,
  dimension_weights = EXCLUDED.dimension_weights,
  pathway = EXCLUDED.pathway,
  is_active = true;
