
-- Centralized product analytics
create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  role text,
  route text,
  properties jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

alter table public.platform_events enable row level security;

create index if not exists idx_platform_events_created_at on public.platform_events (created_at desc);
create index if not exists idx_platform_events_event_created on public.platform_events (event_name, created_at desc);
create index if not exists idx_platform_events_user_created on public.platform_events (user_id, created_at desc);

-- Users can insert their own events (or anonymous, when user_id is null)
create policy "users insert own events"
on public.platform_events for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

-- Anonymous insert (pre-login marketing events) — only allowed when user_id is null
create policy "anon insert anonymous events"
on public.platform_events for insert
to anon
with check (user_id is null);

-- Only admins can read
create policy "admins read events"
on public.platform_events for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));
