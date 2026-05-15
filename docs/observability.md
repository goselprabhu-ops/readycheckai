# Observability & Operational Monitoring

ReadyCheck Lab ships operational visibility through three layers:

## 1. Structured logs

`src/lib/observability.ts` exposes `logEvent({ eventType, severity, source, route, message, latencyMs, metadata })`.
Every call emits a single-line JSON log to stdout (Logtail / Datadog / Cloudflare-compatible) **and** records the event into the `system_events` table via the `log_system_event` SECURITY DEFINER RPC. Logging is best-effort: failures never propagate to the caller.

`withTiming({ eventType, source, route }, fn)` wraps an async unit of work, records latency, warns on >2s, and logs errors as severity `error`.

## 2. Health endpoints

- `GET /api/public/health` — env presence + DB ping + latency. Suitable for UptimeRobot / BetterStack.
- `GET /api/public/health/email-queue` — queue depth, oldest-pending age, DLQ rate, rate-limit state.

Both endpoints are unauthenticated (under `/api/public/`) and never return PII.

## 3. Operator UI

The admin panel (`/admin`) renders a `System Diagnostics` card that calls the authenticated `getSystemDiagnostics` server function. It surfaces:

- DB reachability + latency
- Error/critical counts in the last 24h
- Resume pipeline volume + failures
- AI usage today (per feature)
- Environment-secret presence
- Recent error events with timestamps

## Frontend error tracking

No third-party SDK is wired by default. To add Sentry, install `@sentry/react`, initialize with `VITE_SENTRY_DSN` in `src/router.tsx`, and the existing `__root.tsx` error boundary will forward exceptions automatically. Server errors already flow through `system_events` and structured logs.

## Backups, migrations, and environment

- Database backups: managed by Lovable Cloud (point-in-time recovery available on paid tiers).
- Migrations: every change ships as a timestamped file under `supabase/migrations/` and is applied on publish.
- Environment verification: `getSystemDiagnostics.env` and `/api/public/health` both report whether `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `TWILIO_API_KEY`, and `MSG91_AUTH_KEY` are present at runtime.