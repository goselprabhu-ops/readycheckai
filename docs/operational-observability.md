# Operational Observability (Phase 4)

ReadyCheck Lab uses zero third-party error/perf SDKs. All telemetry is
self-hosted in `public.system_events` (severity-tagged, route-tagged) so
the admin diagnostics page can surface the same signal an external tool
like Sentry/Datadog would.

## Channels

| Source         | Endpoint                       | Writer                             | Severity mapping                |
| -------------- | ------------------------------ | ---------------------------------- | ------------------------------- |
| `web-vitals`   | `POST /api/public/web-vitals`  | `src/lib/web-vitals.ts` (browser)  | rating → info / warn / error    |
| `client-error` | `POST /api/public/client-errors` | `src/lib/error-reporter.ts`     | always `error`                  |
| server fns     | direct `log_system_event` RPC  | server functions (`*.functions.ts`) | author-set                      |

All three feed `system_health_summary`, which the admin diagnostics view
already pivots by `event_type` × `severity`.

## Ring / focus consistency

Audited Phase 4: every interactive surface uses the semantic
`focus-visible:ring-ring` token (sidebar primitives use `ring-sidebar-ring`
intentionally). No raw color rings remain.

## E2E happy-path coverage (manual smoke list)

Run before each release in an incognito window against the preview URL:

1. Sign up → email verify → land on `/onboarding`.
2. Complete onboarding → `/dashboard` shows zero-state.
3. Upload a 2-page text PDF on `/resume` → status reaches `ready`,
   confidence ≥ 70 %, no OCR badge.
4. Upload a scanned PDF → OCR badge appears, low-confidence alert visible.
5. Start an assessment → answers persist on refresh, score on submit.
6. Re-attempt cooldown enforced (≤ N hours).
7. Sign out → protected routes (`/dashboard`, `/resume`, `/assessment`)
   redirect to `/login`.

This list is the contract for the future Playwright suite scaffolded in
`docs/ci-quality-gates.md`.
