
-- Institution role enum
do $$ begin
  create type public.institution_role as enum ('owner','admin','staff','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.institution_type as enum ('college','bootcamp','placement_center','other');
exception when duplicate_object then null; end $$;

-- Institutions
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.institution_type not null default 'college',
  contact_email text,
  domain text,
  logo_url text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.institutions enable row level security;

create table if not exists public.institution_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null,
  role public.institution_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (institution_id, user_id)
);
alter table public.institution_members enable row level security;
create index if not exists idx_institution_members_user on public.institution_members(user_id);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  department text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);
alter table public.cohorts enable row level security;
create index if not exists idx_cohorts_institution on public.cohorts(institution_id);

create table if not exists public.institution_students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete set null,
  user_id uuid not null,
  student_email text,
  department text,
  enrollment_no text,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique (institution_id, user_id)
);
alter table public.institution_students enable row level security;
create index if not exists idx_institution_students_inst on public.institution_students(institution_id);
create index if not exists idx_institution_students_user on public.institution_students(user_id);
create index if not exists idx_institution_students_cohort on public.institution_students(cohort_id);

-- Membership helper (security definer to avoid recursive RLS)
create or replace function public.is_institution_member(_inst uuid, _user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.institution_members
    where institution_id = _inst and user_id = _user
  );
$$;

create or replace function public.has_institution_role(_inst uuid, _user uuid, _roles public.institution_role[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.institution_members
    where institution_id = _inst and user_id = _user and role = any(_roles)
  );
$$;

-- Policies: institutions
create policy "members read inst" on public.institutions for select to authenticated
  using (public.is_institution_member(id, auth.uid()) or public.has_role(auth.uid(), 'admin'::app_role));

create policy "any auth create inst" on public.institutions for insert to authenticated
  with check (auth.uid() = created_by);

create policy "owners update inst" on public.institutions for update to authenticated
  using (public.has_institution_role(id, auth.uid(), array['owner','admin']::public.institution_role[]) or public.has_role(auth.uid(),'admin'::app_role));

create policy "owners delete inst" on public.institutions for delete to authenticated
  using (public.has_institution_role(id, auth.uid(), array['owner']::public.institution_role[]) or public.has_role(auth.uid(),'admin'::app_role));

-- Policies: members
create policy "members read members" on public.institution_members for select to authenticated
  using (public.is_institution_member(institution_id, auth.uid()) or public.has_role(auth.uid(),'admin'::app_role));

create policy "self-bootstrap owner" on public.institution_members for insert to authenticated
  with check (
    user_id = auth.uid() and role = 'owner'
    and exists (select 1 from public.institutions i where i.id = institution_id and i.created_by = auth.uid())
  );

create policy "admins manage members" on public.institution_members for insert to authenticated
  with check (public.has_institution_role(institution_id, auth.uid(), array['owner','admin']::public.institution_role[]));

create policy "admins update members" on public.institution_members for update to authenticated
  using (public.has_institution_role(institution_id, auth.uid(), array['owner','admin']::public.institution_role[]));

create policy "admins delete members" on public.institution_members for delete to authenticated
  using (public.has_institution_role(institution_id, auth.uid(), array['owner','admin']::public.institution_role[]));

-- Policies: cohorts
create policy "members read cohorts" on public.cohorts for select to authenticated
  using (public.is_institution_member(institution_id, auth.uid()) or public.has_role(auth.uid(),'admin'::app_role));

create policy "admins manage cohorts" on public.cohorts for all to authenticated
  using (public.has_institution_role(institution_id, auth.uid(), array['owner','admin','staff']::public.institution_role[]))
  with check (public.has_institution_role(institution_id, auth.uid(), array['owner','admin','staff']::public.institution_role[]));

-- Policies: students
create policy "members read students" on public.institution_students for select to authenticated
  using (public.is_institution_member(institution_id, auth.uid()) or public.has_role(auth.uid(),'admin'::app_role) or user_id = auth.uid());

create policy "admins manage students" on public.institution_students for all to authenticated
  using (public.has_institution_role(institution_id, auth.uid(), array['owner','admin','staff']::public.institution_role[]))
  with check (public.has_institution_role(institution_id, auth.uid(), array['owner','admin','staff']::public.institution_role[]));

-- updated_at trigger
drop trigger if exists trg_institutions_updated on public.institutions;
create trigger trg_institutions_updated before update on public.institutions
  for each row execute function public.set_updated_at();

-- Aggregated cohort analytics (admin-of-institution only)
create or replace function public.institution_dashboard(_inst uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  _result jsonb;
begin
  if not (public.is_institution_member(_inst, auth.uid()) or public.has_role(auth.uid(),'admin'::app_role)) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  with students as (
    select s.*, p.full_name, p.target_role
    from public.institution_students s
    left join public.profiles p on p.id = s.user_id
    where s.institution_id = _inst
  ),
  latest_readiness as (
    select distinct on (rh.user_id) rh.user_id, rh.readiness, rh.level, rh.sql_score, rh.python_score, rh.resume_score, rh.computed_at
    from public.readiness_history rh
    where rh.user_id in (select user_id from students)
    order by rh.user_id, rh.computed_at desc
  ),
  joined as (
    select s.*, lr.readiness, lr.level, lr.sql_score, lr.python_score, lr.resume_score
    from students s
    left join latest_readiness lr on lr.user_id = s.user_id
  )
  select jsonb_build_object(
    'totals', (select jsonb_build_object(
      'students', count(*),
      'with_readiness', count(*) filter (where readiness is not null),
      'avg_readiness', coalesce(round(avg(readiness))::int, 0),
      'avg_sql', coalesce(round(avg(sql_score))::int, 0),
      'avg_python', coalesce(round(avg(python_score))::int, 0),
      'avg_resume', coalesce(round(avg(resume_score))::int, 0)
    ) from joined),
    'level_buckets', (select coalesce(jsonb_object_agg(level, c), '{}'::jsonb) from (
      select coalesce(level,'Unscored') as level, count(*)::int c from joined group by 1
    ) x),
    'readiness_buckets', (select jsonb_build_object(
      'placement_ready', count(*) filter (where readiness >= 75),
      'almost_ready', count(*) filter (where readiness >= 55 and readiness < 75),
      'developing', count(*) filter (where readiness >= 35 and readiness < 55),
      'at_risk', count(*) filter (where readiness is not null and readiness < 35),
      'unscored', count(*) filter (where readiness is null)
    ) from joined),
    'by_department', (select coalesce(jsonb_agg(row_to_json(d) order by d.dept), '[]'::jsonb) from (
      select coalesce(department,'Unassigned') as dept,
             count(*)::int students,
             coalesce(round(avg(readiness))::int,0) as avg_readiness,
             count(*) filter (where readiness >= 75)::int as ready
      from joined group by 1
    ) d),
    'by_cohort', (select coalesce(jsonb_agg(row_to_json(c) order by c.cohort_name), '[]'::jsonb) from (
      select coalesce(c.name,'No cohort') as cohort_name,
             c.department as cohort_department,
             count(j.*)::int as students,
             coalesce(round(avg(j.readiness))::int,0) as avg_readiness,
             count(*) filter (where j.readiness >= 75)::int as ready,
             count(*) filter (where j.readiness is not null and j.readiness < 35)::int as at_risk
      from joined j left join public.cohorts c on c.id = j.cohort_id
      group by 1, 2
    ) c),
    'weak_skills', (
      select jsonb_build_object(
        'sql_weak', count(*) filter (where sql_score is not null and sql_score < 50),
        'python_weak', count(*) filter (where python_score is not null and python_score < 50),
        'resume_weak', count(*) filter (where resume_score is not null and resume_score < 50)
      ) from joined
    ),
    'top_students', (select coalesce(jsonb_agg(row_to_json(t) order by t.readiness desc nulls last) , '[]'::jsonb) from (
      select user_id, full_name, target_role, department, readiness, level, sql_score, python_score, resume_score
      from joined order by readiness desc nulls last limit 25
    ) t),
    'at_risk_students', (select coalesce(jsonb_agg(row_to_json(t) order by t.readiness asc nulls first) , '[]'::jsonb) from (
      select user_id, full_name, target_role, department, readiness, sql_score, python_score, resume_score
      from joined where readiness is null or readiness < 40 order by readiness asc nulls first limit 25
    ) t)
  ) into _result;

  return _result;
end;
$$;
