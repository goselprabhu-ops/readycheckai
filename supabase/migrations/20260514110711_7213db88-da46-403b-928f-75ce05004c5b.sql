
-- =========================
-- Catalog: target_roles
-- =========================
CREATE TABLE public.target_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.target_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read target_roles" ON public.target_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage target_roles" ON public.target_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- assessment_definitions
-- =========================
CREATE TYPE public.assessment_category AS ENUM ('sql','python','resume');

CREATE TABLE public.assessment_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.target_roles(id) ON DELETE CASCADE,
  category assessment_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assessment_defs_role ON public.assessment_definitions(role_id);
CREATE INDEX idx_assessment_defs_category ON public.assessment_definitions(category);

ALTER TABLE public.assessment_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read assessment_definitions" ON public.assessment_definitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage assessment_definitions" ON public.assessment_definitions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- questions
-- =========================
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessment_definitions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_assessment ON public.questions(assessment_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read questions" ON public.questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage questions" ON public.questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- assessment_attempts
-- =========================
CREATE TABLE public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL REFERENCES public.assessment_definitions(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX idx_attempts_assessment ON public.assessment_attempts(assessment_id);

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts select" ON public.assessment_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attempts insert" ON public.assessment_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attempts update" ON public.assessment_attempts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read attempts" ON public.assessment_attempts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- scores (per-question)
-- =========================
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scores_attempt ON public.scores(attempt_id);
CREATE INDEX idx_scores_question ON public.scores(question_id);
CREATE INDEX idx_scores_user ON public.scores(user_id);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scores select" ON public.scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own scores insert" ON public.scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read scores" ON public.scores
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- recommendations
-- =========================
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempt_id UUID REFERENCES public.assessment_attempts(id) ON DELETE SET NULL,
  category assessment_category,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recommendations_user ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_attempt ON public.recommendations(attempt_id);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recs select" ON public.recommendations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own recs insert" ON public.recommendations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recs update" ON public.recommendations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own recs delete" ON public.recommendations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read recs" ON public.recommendations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- Seed: target roles
-- =========================
INSERT INTO public.target_roles (slug, name, description) VALUES
  ('data-analyst','Data Analyst','SQL, Python, dashboards, business insights'),
  ('data-engineer','Data Engineer','Pipelines, warehousing, orchestration'),
  ('ml-engineer','ML Engineer','Model training, deployment, MLOps'),
  ('backend-developer','Backend Developer','APIs, services, databases'),
  ('devops-engineer','DevOps Engineer','CI/CD, infrastructure, observability');

-- =========================
-- Seed: Data Analyst assessments + questions
-- =========================
WITH da AS (SELECT id FROM public.target_roles WHERE slug='data-analyst'),
sql_def AS (
  INSERT INTO public.assessment_definitions (role_id, category, title, description)
  SELECT da.id, 'sql', 'SQL Fundamentals', 'Core SQL for Data Analysts' FROM da
  RETURNING id
),
py_def AS (
  INSERT INTO public.assessment_definitions (role_id, category, title, description)
  SELECT da.id, 'python', 'Python for Data Analysis', 'Pandas, basics, data manipulation' FROM da
  RETURNING id
),
resume_def AS (
  INSERT INTO public.assessment_definitions (role_id, category, title, description)
  SELECT da.id, 'resume', 'Resume Readiness', 'Resume strength check for Data Analyst roles' FROM da
  RETURNING id
)
INSERT INTO public.questions (assessment_id, prompt, options, correct_answer, order_index, points)
SELECT id, prompt, options::jsonb, correct_answer, ord, 1 FROM (
  SELECT (SELECT id FROM sql_def) AS id,
    'Which SQL clause filters rows after aggregation?' AS prompt,
    '["WHERE","HAVING","GROUP BY","ORDER BY"]' AS options,
    'HAVING' AS correct_answer, 1 AS ord
  UNION ALL SELECT (SELECT id FROM sql_def),
    'What does INNER JOIN return?',
    '["All rows from left table","All rows from right table","Only matching rows from both","Cartesian product"]',
    'Only matching rows from both', 2
  UNION ALL SELECT (SELECT id FROM sql_def),
    'Which keyword removes duplicate rows in a SELECT?',
    '["UNIQUE","DISTINCT","DEDUPE","FILTER"]',
    'DISTINCT', 3
  UNION ALL SELECT (SELECT id FROM sql_def),
    'Which function returns the number of rows?',
    '["SUM()","COUNT()","AVG()","MAX()"]',
    'COUNT()', 4
  UNION ALL SELECT (SELECT id FROM sql_def),
    'Which clause sorts the result set?',
    '["GROUP BY","ORDER BY","SORT","ARRANGE"]',
    'ORDER BY', 5
  UNION ALL SELECT (SELECT id FROM py_def),
    'Which library is standard for tabular data analysis in Python?',
    '["numpy","pandas","matplotlib","requests"]',
    'pandas', 1
  UNION ALL SELECT (SELECT id FROM py_def),
    'How do you read a CSV with pandas?',
    '["pd.open_csv()","pd.read_csv()","pd.load_csv()","pd.csv()"]',
    'pd.read_csv()', 2
  UNION ALL SELECT (SELECT id FROM py_def),
    'Which method returns the first 5 rows of a DataFrame?',
    '["df.first()","df.head()","df.top()","df.peek()"]',
    'df.head()', 3
  UNION ALL SELECT (SELECT id FROM py_def),
    'What is the output type of df.groupby("col")?',
    '["DataFrame","Series","DataFrameGroupBy","dict"]',
    'DataFrameGroupBy', 4
  UNION ALL SELECT (SELECT id FROM py_def),
    'Which operator is used for element-wise AND in pandas filtering?',
    '["and","&","&&","AND"]',
    '&', 5
) q;
