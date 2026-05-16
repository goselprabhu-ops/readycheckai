
-- Skill trend over time
CREATE TABLE IF NOT EXISTS public.market_skills_trend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill text NOT NULL,
  category text NOT NULL DEFAULT 'tool',
  month date NOT NULL,
  demand_index integer NOT NULL DEFAULT 50,
  postings integer NOT NULL DEFAULT 0,
  growth_pct numeric(6,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (skill, month)
);
CREATE INDEX IF NOT EXISTS idx_market_skills_trend_skill ON public.market_skills_trend(skill);
CREATE INDEX IF NOT EXISTS idx_market_skills_trend_month ON public.market_skills_trend(month);

-- Role demand
CREATE TABLE IF NOT EXISTS public.market_role_demand (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_slug text NOT NULL,
  role_name text NOT NULL,
  month date NOT NULL,
  openings integer NOT NULL DEFAULT 0,
  demand_index integer NOT NULL DEFAULT 50,
  growth_pct numeric(6,2) NOT NULL DEFAULT 0,
  region text NOT NULL DEFAULT 'global',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_slug, month, region)
);
CREATE INDEX IF NOT EXISTS idx_market_role_demand_role ON public.market_role_demand(role_slug);

-- Salary bands
CREATE TABLE IF NOT EXISTS public.market_salary_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_slug text NOT NULL,
  role_name text NOT NULL,
  experience_level text NOT NULL,
  region text NOT NULL DEFAULT 'IN',
  currency text NOT NULL DEFAULT 'INR',
  salary_min integer NOT NULL DEFAULT 0,
  salary_median integer NOT NULL DEFAULT 0,
  salary_max integer NOT NULL DEFAULT 0,
  sample_size integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_slug, experience_level, region)
);

-- Industry growth indicators
CREATE TABLE IF NOT EXISTS public.market_industry_growth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  month date NOT NULL,
  hiring_index integer NOT NULL DEFAULT 50,
  growth_pct numeric(6,2) NOT NULL DEFAULT 0,
  top_skill text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (industry, month)
);

-- Enable RLS
ALTER TABLE public.market_skills_trend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_role_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_salary_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_industry_growth ENABLE ROW LEVEL SECURITY;

-- Read policies (signed-in users)
CREATE POLICY "auth read market_skills_trend" ON public.market_skills_trend FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read market_role_demand" ON public.market_role_demand FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read market_salary_bands" ON public.market_salary_bands FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read market_industry_growth" ON public.market_industry_growth FOR SELECT TO authenticated USING (true);

-- Admin write
CREATE POLICY "admins manage market_skills_trend" ON public.market_skills_trend FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage market_role_demand" ON public.market_role_demand FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage market_salary_bands" ON public.market_salary_bands FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage market_industry_growth" ON public.market_industry_growth FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
