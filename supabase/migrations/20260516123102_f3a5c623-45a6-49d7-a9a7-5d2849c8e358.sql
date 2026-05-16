
-- Public profile settings
CREATE TABLE public.public_profile_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text UNIQUE,
  is_public boolean NOT NULL DEFAULT false,
  show_readiness boolean NOT NULL DEFAULT true,
  show_skills boolean NOT NULL DEFAULT true,
  show_projects boolean NOT NULL DEFAULT true,
  show_certifications boolean NOT NULL DEFAULT true,
  show_achievements boolean NOT NULL DEFAULT true,
  show_experience boolean NOT NULL DEFAULT true,
  show_education boolean NOT NULL DEFAULT true,
  show_badges boolean NOT NULL DEFAULT true,
  show_contact boolean NOT NULL DEFAULT false,
  tagline text,
  theme text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pps_slug ON public.public_profile_settings(slug) WHERE slug IS NOT NULL;

ALTER TABLE public.public_profile_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own pps select" ON public.public_profile_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own pps insert" ON public.public_profile_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pps update" ON public.public_profile_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_pps_updated BEFORE UPDATE ON public.public_profile_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Badge catalog
CREATE TABLE public.badge_definitions (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  category text NOT NULL DEFAULT 'skill',
  tier text NOT NULL DEFAULT 'bronze',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read badges" ON public.badge_definitions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage badges" ON public.badge_definitions
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.badge_definitions (key,name,description,icon,category,tier,criteria) VALUES
('sql_expert','SQL Expert','Scored 85%+ on an SQL assessment','database','skill','gold','{"type":"assessment_topic","topic":"sql","min_pct":85}'),
('python_pro','Python Pro','Scored 80%+ on a Python assessment','code','skill','gold','{"type":"assessment_topic","topic":"python","min_pct":80}'),
('viz_specialist','Visualization Specialist','Scored 80%+ on Power BI / Visualization','bar-chart-3','skill','silver','{"type":"assessment_topic","topic":"visualization","min_pct":80}'),
('stats_ace','Statistics Ace','Scored 80%+ on a Statistics assessment','sigma','skill','silver','{"type":"assessment_topic","topic":"statistics","min_pct":80}'),
('interview_ready','Interview Ready','Completed a mock interview with 75+ overall score','mic','performance','gold','{"type":"interview_overall","min_score":75}'),
('resume_optimized','Resume Optimized','ATS resume score of 80 or higher','file-text','performance','silver','{"type":"resume_ats","min_score":80}'),
('top_performer','Top Performer','Composite employability score of 85+','trophy','performance','gold','{"type":"composite","min_score":85}'),
('fast_learner','Fast Learner','Completed 5+ learning path items','sparkles','growth','bronze','{"type":"learning_items","min_count":5}'),
('consistent','Consistent Practitioner','Attempted 5+ assessments','flame','growth','bronze','{"type":"attempts_count","min_count":5}'),
('role_ready_da','Data Analyst Ready','Role readiness 75+ for Data Analyst','target','role','gold','{"type":"role_readiness","role":"data-analyst","min_score":75}')
ON CONFLICT (key) DO NOTHING;

-- User badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL REFERENCES public.badge_definitions(key) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own badges select" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own badges insert" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read all badges" ON public.user_badges
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- Public profile RPC: callable by anon, returns only data the owner has chosen to expose
CREATE OR REPLACE FUNCTION public.get_public_profile(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _settings public.public_profile_settings%ROWTYPE;
  _profile public.profiles%ROWTYPE;
  _result jsonb;
  _readiness jsonb;
  _badges jsonb;
  _skills jsonb;
BEGIN
  SELECT * INTO _settings FROM public.public_profile_settings
    WHERE slug = _slug AND is_public = true;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO _profile FROM public.profiles WHERE id = _settings.user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF _settings.show_readiness THEN
    SELECT to_jsonb(r) INTO _readiness FROM (
      SELECT readiness, level, sql_score, python_score, resume_score, computed_at
      FROM public.readiness_history WHERE user_id = _settings.user_id
      ORDER BY computed_at DESC LIMIT 1
    ) r;
  END IF;

  IF _settings.show_badges THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'key', b.key, 'name', b.name, 'description', b.description,
      'icon', b.icon, 'category', b.category, 'tier', b.tier,
      'awarded_at', ub.awarded_at
    ) ORDER BY ub.awarded_at DESC), '[]'::jsonb) INTO _badges
    FROM public.user_badges ub
    JOIN public.badge_definitions b ON b.key = ub.badge_key
    WHERE ub.user_id = _settings.user_id;
  END IF;

  IF _settings.show_skills THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'level', s.level) ORDER BY s.level DESC), '[]'::jsonb)
      INTO _skills FROM public.skills s WHERE s.user_id = _settings.user_id;
  END IF;

  _result := jsonb_build_object(
    'slug', _settings.slug,
    'tagline', _settings.tagline,
    'theme', _settings.theme,
    'profile', jsonb_build_object(
      'full_name', _profile.full_name,
      'headline', _profile.headline,
      'photo_url', coalesce(_profile.photo_url, _profile.avatar_url),
      'location', _profile.location,
      'target_role', _profile.target_role,
      'college', _profile.college,
      'summary', _profile.summary,
      'linkedin_url', _profile.linkedin_url,
      'github_url', _profile.github_url,
      'portfolio_url', _profile.portfolio_url,
      'email', CASE WHEN _settings.show_contact THEN (SELECT email FROM auth.users WHERE id = _settings.user_id) ELSE NULL END,
      'phone', CASE WHEN _settings.show_contact THEN _profile.phone ELSE NULL END
    ),
    'sections', jsonb_build_object(
      'experience', CASE WHEN _settings.show_experience THEN _profile.experience ELSE '[]'::jsonb END,
      'education', CASE WHEN _settings.show_education THEN _profile.education ELSE '[]'::jsonb END,
      'projects', CASE WHEN _settings.show_projects THEN _profile.projects ELSE '[]'::jsonb END,
      'certifications', CASE WHEN _settings.show_certifications THEN _profile.certifications ELSE '[]'::jsonb END,
      'achievements', CASE WHEN _settings.show_achievements THEN _profile.achievements ELSE '[]'::jsonb END,
      'skills', coalesce(_skills, '[]'::jsonb)
    ),
    'readiness', _readiness,
    'badges', coalesce(_badges, '[]'::jsonb)
  );
  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;
