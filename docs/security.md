# ReadyCheck Lab — Security Model

This document describes the trust boundaries, abuse-protection
mechanisms, and operational practices that keep the platform safe for
institutional and recruiter use.

## Trust boundaries

| Layer                | Trust    | Notes                                                              |
| -------------------- | -------- | ------------------------------------------------------------------ |
| Browser              | Untrusted | All inputs validated server-side with Zod.                        |
| TanStack server fns  | Trusted   | Run on Cloudflare Workers; require `requireSupabaseAuth`.         |
| Supabase RLS         | Enforced  | Every public table has explicit policies; default-deny otherwise. |
| Service-role client  | Trusted   | Only used in `*.server.ts`; never imported from client modules.   |

## Authentication & sessions

- Email + password and Google OAuth via Supabase Auth.
- Session JWT stored in `localStorage` (Supabase default), attached to
  every server-fn RPC by `attachSupabaseAuth` middleware.
- `requireSupabaseAuth` middleware verifies the bearer token on every
  protected call.

## CSRF protection

TanStack server functions are immune to traditional cookie-based CSRF
because:

1. Auth tokens live in `localStorage`, **not** cookies — a cross-origin
   form post cannot attach the user's session.
2. The browser sends the token explicitly via the
   `Authorization: Bearer …` header that our middleware attaches.
3. Server-fn RPCs are `POST` with a JSON body and require the bearer
   header; same-origin policy prevents arbitrary sites from reading or
   forging it.

If we ever migrate to cookie-based sessions, add a double-submit CSRF
token to every state-changing request.

## Abuse protection

| Mechanism            | Where                                | Knob                                  |
| -------------------- | ------------------------------------ | ------------------------------------- |
| Per-user daily quota | `ai_usage_daily` + `increment_ai_usage` RPC | `AI_CAPS` in `src/lib/ai-guardrails.ts` |
| Per-action cooldown  | `check_action_cooldown` RPC          | seconds per action in server fns      |
| Audit log            | `security_events` table              | `logSecurityEvent()` helper           |

Current cooldowns:

- `resume_analysis` — 30s
- `roadmap_generate` — 60s
- `interview_message` — 2s
- `assessment_submit` — 5s
- `assessment_gen` — 30s

### Known gap: request-level rate limiting

The platform does **not** ship a global IP-level or request-level rate
limiter. Cloudflare WAF sits in front of the worker but is not
programmatically configured here. Per-user quotas + cooldowns cover the
common abuse vectors (cost runaway, scraping, brute-force). When proper
rate-limit primitives land, prefer them over an in-memory limiter inside
the worker (which would not survive cold starts or scale horizontally).

## Row-level security highlights

- `question_secrets` — RESTRICTIVE deny for `anon` + `authenticated`;
  service role only. Never queried from the browser.
- Email tables (`email_send_log`, `email_send_state`,
  `email_unsubscribe_tokens`, `suppressed_emails`) — RESTRICTIVE deny
  for `anon` + `authenticated`.
- `security_events` — admin SELECT only; INSERT only via
  `log_security_event()` SECURITY DEFINER RPC.
- `resumes` storage bucket — owner-prefixed paths only
  (`<user_id>/filename`).

## Secret handling

- All secrets live in Supabase Secrets / Cloudflare env vars and are
  read with `process.env.X` **inside** server-function `.handler()`
  blocks. Never at module scope, never in client code.
- `LOVABLE_API_KEY` is rotated via the dedicated rotation tool, not
  manual update.
- `SUPABASE_SERVICE_ROLE_KEY` is only imported from
  `src/integrations/supabase/client.server.ts` and never re-exported.

## Audit logging

Use `logSecurityEvent(supabase, { eventType, severity, metadata })` for:

- Failed authentication / authorization
- Cooldown blocks (already auto-logged)
- Quota cap hits
- Admin actions on user data
- Webhook signature mismatches

Severity vocabulary: `info | warn | error | critical`.

## Incident response

1. Check `security_events` filtered by `severity in ('error','critical')`
   in the last 24h.
2. Cross-reference `ai_usage_daily` for cost spikes.
3. If a key may be compromised, rotate via the secrets/rotation tools
   and force a Cloudflare deploy to drop in-flight workers.