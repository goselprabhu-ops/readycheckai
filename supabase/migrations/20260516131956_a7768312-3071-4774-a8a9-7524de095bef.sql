-- Idempotency table for Stripe webhook events
create table if not exists public.processed_stripe_events (
  event_id text primary key,
  type text not null,
  environment text not null,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;

-- Service role only (no user-facing policies needed; admin client bypasses RLS)
create policy "no client access" on public.processed_stripe_events
  for select using (false);

create index if not exists idx_processed_stripe_events_processed_at
  on public.processed_stripe_events(processed_at desc);

-- Updated institution_dashboard with filters + pagination on student lists
create or replace function public.institution_dashboard(
  _inst uuid,
  _department text default null,
  _cohort_id uuid default null,
  _limit integer default 25,
  _offset integer default 0
)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  _result jsonb;
  _lim integer := greatest(least(coalesce(_limit, 25), 200), 1);
  _off integer := greatest(coalesce(_offset, 0), 0);
begin
  if not (public.is_institution_member(_inst, auth.uid()) or public.has_role(auth.uid(),'admin'::app_role)) then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  with students as (
    select s.*, p.full_name, p.target_role
    from public.institution_students s
    left join public.profiles p on p.id = s.user_id
    where s.institution_id = _inst
      and (_department is null or s.department = _department)
      and (_cohort_id is null or s.cohort_id = _cohort_id)
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
    'page', jsonb_build_object('limit', _lim, 'offset', _off, 'total', (select count(*) from joined)),
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
    'top_students', (select coalesce(jsonb_agg(row_to_json(t) order by t.readiness desc nulls last), '[]'::jsonb) from (
      select user_id, full_name, target_role, department, readiness, level, sql_score, python_score, resume_score
      from joined order by readiness desc nulls last limit _lim offset _off
    ) t),
    'at_risk_students', (select coalesce(jsonb_agg(row_to_json(t) order by t.readiness asc nulls first), '[]'::jsonb) from (
      select user_id, full_name, target_role, department, readiness, sql_score, python_score, resume_score
      from joined where readiness is null or readiness < 40 order by readiness asc nulls first limit _lim offset _off
    ) t)
  ) into _result;

  return _result;
end;
$function$;