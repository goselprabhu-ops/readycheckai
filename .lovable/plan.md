
# Version 1 Rollout — Phased Plan

The MVP.1–MVP.7 hardening trail is complete and the readiness report returned a **GO**. To evolve into Version 1 safely, we'll ship in 4 small phases instead of one big push, so each phase can be reviewed, tested, and rolled back independently.

---

## Phase 1 — Launch Blockers (P0)

Goal: Close the two items the readiness report flagged as required before opening to institutional users.

1. **Lock down SECURITY DEFINER RPCs**
   - Apply `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated` and re-`GRANT` only to `service_role` for the 7 helpers: `read_email_batch`, `enqueue_email`, `delete_email`, `move_to_dlq`, `log_system_event`, plus the two email-token helpers.
   - Keep `increment_ai_usage`, `check_action_cooldown`, `log_security_event`, `has_role`, `system_health_summary` callable by `authenticated` (they self-check `auth.uid()` / role).
2. **Enable HIBP password breach check** in Supabase Auth config via `configure_auth`.
3. Re-run `supabase--linter` + `security--run_security_scan` to confirm green.

Deliverable: migration + auth config update. No UI changes.

---

## Phase 2 — Quality Gates in CI (P1)

Goal: Prevent regressions in accessibility and performance once we start moving fast.

1. **axe-core a11y gate** — add `@axe-core/playwright` smoke test on `/`, `/dashboard`, `/resume`, `/onboarding`, `/assessment`. Fail build on serious/critical violations.
2. **Web Vitals beacon** — wire `onCLS/onINP/onLCP` from `web-vitals` into the existing `logEvent` pipeline (`system_events` with `source='web-vitals'`).
3. **Bundle budget** — add a `vite-bundle-visualizer`-based size check for the main chunk (warn >250 KB gz, fail >350 KB gz).
4. **Design token consolidation** — sweep remaining hardcoded gradients into `src/styles.css` tokens.

Deliverable: CI workflow + small refactors. Documented in `docs/observability.md`.

---

## Phase 3 — Resume Pipeline Maturity (P2)

Goal: Move resume analysis from "reliable" to "trustworthy at scale".

1. **Real OCR provider** for scanned PDFs (Tesseract WASM in the server fn, or external API behind a secret) — replace the current `parser_status='ocr'` stub with actual extraction.
2. **Background job queue** for long extractions: enqueue in `pgmq` (`resume_extract` queue), process via existing worker pattern, free up the request thread.
3. **User-facing extraction states** — surface `parser_status` + `extraction_confidence` on the resume page with a retry CTA when confidence is low.
4. **Pruning cron** — `pg_cron` job to expire stale `resume_analyses` drafts and orphan storage objects weekly.

Deliverable: 1 migration (queue + cron), 1 server fn (worker), small UI update on `/resume`.

---

## Phase 4 — Operational & UX Polish (P2/P3)

Goal: Round off the remaining nice-to-haves so V1 feels finished.

1. **Sentry SDK** for frontend errors (already documented; just wire the DSN secret + `init`).
2. **`LazyMotion`** migration — switch `src/lib/motion.ts` to `LazyMotion + domAnimation` and rewrite `motion.*` → `m.*` across the 7 consumer files. Saves ~30 KB gz.
3. **Ring component consolidation** — merge `ScoreRing` + `ReadinessRing` into one parameterized component.
4. **E2E happy path** — Playwright spec: signup → onboarding → resume upload → assessment → dashboard.

Deliverable: small refactors + 1 test file.

---

## Sequencing & Checkpoints

```text
Phase 1  →  ship & verify (linter+scan green)        ← launch unblocker
Phase 2  →  ship & verify (CI green on PR)
Phase 3  →  ship & verify (resume e2e on staging)
Phase 4  →  ship & verify (full e2e + bundle report)
```

After each phase I'll stop, summarize what changed, and wait for your go-ahead before starting the next one. That keeps blast radius small and lets you re-prioritize between phases (e.g. promote a Phase 4 item if a partner asks).

---

## Technical Notes

- **Migrations**: each phase ships at most one migration to keep rollback simple.
- **Secrets needed later**: Sentry DSN (Phase 4), optional OCR API key (Phase 3) — I'll request via `add_secret` only when that phase starts.
- **No schema breakage**: all new tables/columns are additive; existing RLS patterns reused.
- **Type regen**: `src/integrations/supabase/types.ts` auto-updates after each migration — do not hand-edit.

---

**Recommendation:** start with **Phase 1** now (smallest, unblocks launch). Reply to confirm and I'll execute it.
