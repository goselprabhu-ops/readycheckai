
create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','warn','error','critical')),
  source text,
  route text,
  message text,
  latency_ms integer,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists system_events_created_at_idx
  on public.system_events (created_at desc);
create index if not exists system_events_severity_created_at_idx
  on public.system_events (severity, created_at desc);
create index if not exists system_events_event_type_idx
  on public.system_events (event_type, created_at desc);

alter table public.system_events enable row level security;

create policy "admins read system_events"
  on public.system_events for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "deny non-service system_events"
  on public.system_events as restrictive
  for all
  to anon, authenticated
  using (false) with check (false);

create or replace function public.log_system_event(
  _event_type text,
  _severity text default 'info',
  _source text default null,
  _route text default null,
  _message text default null,
  _latency_ms integer default null,
  _metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare _id uuid;
begin
  if _severity not in ('info','warn','error','critical') then
    _severity := 'info';
  end if;
  insert into public.system_events
    (event_type, severity, source, route, message, latency_ms, metadata)
  values
    (_event_type, _severity, _source, _route, _message, _latency_ms, coalesce(_metadata, '{}'::jsonb))
  returning id into _id;
  return _id;
end;
$$;

revoke all on function public.log_system_event(text,text,text,text,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.log_system_event(text,text,text,text,text,integer,jsonb) to service_role;

create or replace function public.system_health_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _result jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'window_hours', 24,
    'checked_at', now(),
    'totals', (
      select jsonb_build_object(
        'total', count(*),
        'info', count(*) filter (where severity = 'info'),
        'warn', count(*) filter (where severity = 'warn'),
        'error', count(*) filter (where severity = 'error'),
        'critical', count(*) filter (where severity = 'critical')
      )
      from public.system_events
      where created_at > now() - interval '24 hours'
    ),
    'by_source', (
      select coalesce(jsonb_object_agg(source, c), '{}'::jsonb)
      from (
        select coalesce(source, 'unknown') as source, count(*) as c
        from public.system_events
        where created_at > now() - interval '24 hours'
        group by 1
        order by c desc
        limit 20
      ) s
    ),
    'recent_errors', (
      select coalesce(jsonb_agg(row_to_json(e) order by e.created_at desc), '[]'::jsonb)
      from (
        select id, created_at, event_type, severity, source, route, message, metadata
        from public.system_events
        where severity in ('error','critical')
        order by created_at desc
        limit 25
      ) e
    ),
    'security_recent', (
      select coalesce(jsonb_agg(row_to_json(s) order by s.created_at desc), '[]'::jsonb)
      from (
        select id, created_at, event_type, severity, route, metadata
        from public.security_events
        where created_at > now() - interval '24 hours'
          and severity in ('warn','error','critical')
        order by created_at desc
        limit 25
      ) s
    )
  ) into _result;

  return _result;
end;
$$;

revoke all on function public.system_health_summary() from public, anon;
grant execute on function public.system_health_summary() to authenticated;
