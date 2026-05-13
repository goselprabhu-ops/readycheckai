
-- ROLE ENUM + USER_ROLES
create type public.app_role as enum ('student','recruiter','college_admin','institute_admin','gov_admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  college text,
  year text,
  target_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Trigger: create profile + assign student role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student')
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- RESUMES
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  original_name text not null,
  uploaded_at timestamptz not null default now()
);
alter table public.resumes enable row level security;
create policy "own resumes select" on public.resumes for select to authenticated using (auth.uid() = user_id);
create policy "own resumes insert" on public.resumes for insert to authenticated with check (auth.uid() = user_id);
create policy "own resumes delete" on public.resumes for delete to authenticated using (auth.uid() = user_id);

create table public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ats_score int not null default 0,
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.resume_analyses enable row level security;
create policy "own ra select" on public.resume_analyses for select to authenticated using (auth.uid() = user_id);
create policy "own ra insert" on public.resume_analyses for insert to authenticated with check (auth.uid() = user_id);

-- ASSESSMENTS + SKILLS
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  score int not null default 0,
  total int not null default 0,
  breakdown jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.assessments enable row level security;
create policy "own assess select" on public.assessments for select to authenticated using (auth.uid() = user_id);
create policy "own assess insert" on public.assessments for insert to authenticated with check (auth.uid() = user_id);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  level int not null default 0,
  source text,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.skills enable row level security;
create policy "own skills select" on public.skills for select to authenticated using (auth.uid() = user_id);
create policy "own skills upsert" on public.skills for insert to authenticated with check (auth.uid() = user_id);
create policy "own skills update" on public.skills for update to authenticated using (auth.uid() = user_id);

-- ROADMAP
create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  est_minutes int not null default 30,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.roadmap_items enable row level security;
create policy "own roadmap all" on public.roadmap_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- INTERVIEW
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_target text not null default 'Software Engineer',
  created_at timestamptz not null default now()
);
alter table public.interview_sessions enable row level security;
create policy "own sessions all" on public.interview_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.interview_messages enable row level security;
create policy "own messages all" on public.interview_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- EMPLOYABILITY
create table public.employability_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  composite int not null default 0,
  resume_score int not null default 0,
  skills_score int not null default 0,
  market_fit int not null default 0,
  computed_at timestamptz not null default now()
);
alter table public.employability_scores enable row level security;
create policy "own scores select" on public.employability_scores for select to authenticated using (auth.uid() = user_id);
create policy "own scores insert" on public.employability_scores for insert to authenticated with check (auth.uid() = user_id);

-- MARKET DEMAND (seed, public read)
create table public.market_demand_seed (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  skill text not null,
  demand_score int not null default 50
);
alter table public.market_demand_seed enable row level security;
create policy "public read market" on public.market_demand_seed for select to anon, authenticated using (true);

insert into public.market_demand_seed (role, skill, demand_score) values
('Software Engineer','React',92),('Software Engineer','TypeScript',88),('Software Engineer','Node.js',82),('Software Engineer','SQL',78),('Software Engineer','System Design',85),
('Data Analyst','SQL',95),('Data Analyst','Python',90),('Data Analyst','Excel',70),('Data Analyst','Tableau',75),('Data Analyst','Statistics',80),
('Data Scientist','Python',95),('Data Scientist','Machine Learning',92),('Data Scientist','SQL',85),('Data Scientist','Statistics',88),
('Frontend Engineer','React',95),('Frontend Engineer','CSS',85),('Frontend Engineer','TypeScript',88),('Frontend Engineer','Accessibility',70);

-- STORAGE BUCKET for resumes
insert into storage.buckets (id, name, public) values ('resumes','resumes', false)
on conflict (id) do nothing;

create policy "own resume files read" on storage.objects for select to authenticated
using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own resume files insert" on storage.objects for insert to authenticated
with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own resume files delete" on storage.objects for delete to authenticated
using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
