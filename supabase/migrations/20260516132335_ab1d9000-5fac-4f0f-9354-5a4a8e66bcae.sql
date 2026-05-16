-- ============================================================
-- 1. Hot-path indexes
-- ============================================================

-- Dashboard: "latest readiness per user" lookups (DISTINCT ON pattern)
create index if not exists idx_readiness_history_user_computed
  on public.readiness_history (user_id, computed_at desc);

-- "My recent attempts" + per-assessment leaderboard scans
create index if not exists idx_assessment_attempts_user_completed
  on public.assessment_attempts (user_id, completed_at desc);
create index if not exists idx_assessment_attempts_assessment_status_completed
  on public.assessment_attempts (assessment_id, status, completed_at desc);

-- Score aggregation per attempt (used by leaderboard / results pages)
create index if not exists idx_scores_attempt
  on public.scores (attempt_id);

-- Institution roster filtered by cohort / department
create index if not exists idx_institution_students_inst_cohort
  on public.institution_students (institution_id, cohort_id);
create index if not exists idx_institution_students_user
  on public.institution_students (user_id);

-- Active-subscription gating (useSubscription hook + has_active_subscription)
create index if not exists idx_subscriptions_user_env_status
  on public.subscriptions (user_id, environment, status);

-- Interview transcript chronological load
create index if not exists idx_interview_messages_session_created
  on public.interview_messages (session_id, created_at);
create index if not exists idx_interview_messages_user_created
  on public.interview_messages (user_id, created_at desc);

-- Admin security / observability timelines
create index if not exists idx_security_events_user_created
  on public.security_events (user_id, created_at desc);
create index if not exists idx_security_events_created
  on public.security_events (created_at desc);

-- Recommendations panel ("pending + priority order")
create index if not exists idx_recommendations_user_status_priority
  on public.recommendations (user_id, status, priority desc);

-- Resume analyses cleanup + per-user history
create index if not exists idx_resume_analyses_user_created
  on public.resume_analyses (user_id, created_at desc);
create index if not exists idx_resume_analyses_status_created
  on public.resume_analyses (parser_status, created_at);

-- AI usage cap lookups
create index if not exists idx_ai_usage_user_day_feature
  on public.ai_usage_daily (user_id, day, feature);

-- Stripe webhook idempotency housekeeping
create index if not exists idx_processed_stripe_events_processed_at_desc
  on public.processed_stripe_events (processed_at desc);

-- ============================================================
-- 2. Readiness score validation (0..100) via trigger
-- ============================================================

create or replace function public.validate_readiness_score()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.readiness is null or new.readiness < 0 or new.readiness > 100 then
    raise exception 'readiness must be between 0 and 100 (got %)', new.readiness
      using errcode = 'check_violation';
  end if;
  if new.sql_score is not null and (new.sql_score < 0 or new.sql_score > 100) then
    raise exception 'sql_score out of range';
  end if;
  if new.python_score is not null and (new.python_score < 0 or new.python_score > 100) then
    raise exception 'python_score out of range';
  end if;
  if new.resume_score is not null and (new.resume_score < 0 or new.resume_score > 100) then
    raise exception 'resume_score out of range';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_readiness on public.readiness_history;
create trigger trg_validate_readiness
  before insert or update on public.readiness_history
  for each row execute function public.validate_readiness_score();

-- ============================================================
-- 3. Weekly cleanup of failed resume analyses (pg_cron)
-- ============================================================

create extension if not exists pg_cron;

do $$
begin
  -- Unschedule any prior version of this job, then (re)schedule.
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'prune-failed-resume-analyses-weekly';
exception when undefined_table then
  null;
end$$;

select cron.schedule(
  'prune-failed-resume-analyses-weekly',
  '0 3 * * 0',  -- Sundays 03:00 UTC
  $$ select public.prune_failed_resume_analyses(30); $$
);