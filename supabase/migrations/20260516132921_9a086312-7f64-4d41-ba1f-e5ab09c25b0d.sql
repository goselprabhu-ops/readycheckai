
create table if not exists public.ai_response_cache (
  cache_key text primary key,
  feature text not null,
  model text not null,
  response_text text,
  response_json jsonb,
  prompt_tokens integer,
  completion_tokens integer,
  hit_count integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.ai_response_cache enable row level security;

create index if not exists idx_ai_response_cache_expires on public.ai_response_cache (expires_at);
create index if not exists idx_ai_response_cache_feature on public.ai_response_cache (feature, created_at desc);

-- No policies: only service role (which bypasses RLS) can access this table.

-- Daily prune of expired cache rows
create or replace function public.prune_ai_response_cache()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare _deleted integer;
begin
  with del as (
    delete from public.ai_response_cache where expires_at < now() returning 1
  )
  select count(*) into _deleted from del;
  insert into public.system_events (event_type, severity, source, message, metadata)
  values ('ai_cache_prune', 'info', 'cron', 'pruned expired ai cache rows',
          jsonb_build_object('deleted', _deleted));
  return _deleted;
end;
$$;

select cron.schedule(
  'prune-ai-response-cache-daily',
  '15 3 * * *',
  $$select public.prune_ai_response_cache();$$
);
