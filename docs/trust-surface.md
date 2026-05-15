# Phase 5 — Institutional Trust Surface

Three additions help institutional buyers (colleges, recruiters, gov) verify
that the product handles their data responsibly.

## 1. Public Security & Status page (`/security`)

Server-rendered marketing route that explains our security posture
(encryption, RLS, least-privilege RPCs, audit logging, GDPR/DPDP) and shows a
**live system status** card backed by `GET /api/public/health`. Refreshes
every 60s.

SEO: own `<title>`, description, and og tags. Linked from the site footer.

## 2. GDPR / DPDP self-serve data export

Server function: `exportMyData` in `src/lib/gdpr.functions.ts`.

- Auth-gated via `requireSupabaseAuth`.
- Uses the user-scoped supabase client; RLS naturally restricts the result
  set to rows owned by `auth.uid()`.
- Returns a manifest with `exported_at`, `user_id`, `schema_version`, and a
  per-table snapshot for the 15 user-owned tables.
- The export call is logged to `system_events` (`event_type=gdpr_export`).
- Triggered from the profile page footer ("Export my data") — downloads a
  timestamped JSON file in the browser.

## 3. Admin Audit Log viewer

Server function: `listAuditEvents` in `src/lib/audit.functions.ts`.

- Admin-only (role re-checked server-side beyond RLS).
- Merges recent rows from `system_events` and `security_events` with optional
  severity filter and event-type search.
- Surfaced as a new card in `/admin` with kind/severity badges, route, and
  message — refreshable on demand.

## Verification

- `/security` renders without auth, shows live health, and is indexable.
- A signed-in user can click "Export my data" on `/profile` and receive
  a JSON file containing only their rows.
- An admin sees the Audit Log card on `/admin` populated with recent events.