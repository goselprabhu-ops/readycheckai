# ReadyCheck Lab — V1 Remediation Plan

Derived from the audit (composite 5.1/10). Goal: clear all blockers and ship a defensible V1 in ~3 focused sprints (~3–4 weeks).

---

## Sprint 1 — Integrity & Trust (must ship before any paid pilot)

These are the items that make the product defensible. Without them, scores are gameable, readiness is misleading, and pilots will surface embarrassing bugs.

### 1. Lock down assessment integrity (C1, H8)
- Stop sending `correct_answer` to the browser. New server fn `getAttemptQuestions` returns `{ id, prompt, options }` only.
- Move scoring to server: `submitAttempt({ attemptId, answers })` looks up correct answers server-side, writes `scores` + `assessment_attempts.total_score`, marks `completed_at`.
- Server-issued timer: store `attempt_started_at` server-side; reject submits past `started_at + duration`. Client timer becomes display-only.
- Idempotent submit: unique `(attempt_id)` on completion; second submit returns the first result.

### 2. Fix the skills pipeline (C2)
- Add `UNIQUE (user_id, name)` on `skills`.
- Switch `analyzeResumeKeywords` writes to `upsert` on `(user_id, name)` with `level = greatest(existing, new)` and refresh `updated_at`.
- One-time backfill migration to dedupe existing rows (keep max level, newest `updated_at`).

### 3. Rebuild the readiness formula (C3)
- Replace `(SQL + Py + Resume) / 3` with weighted score + completeness multiplier + recency decay:
  - weights configurable per target role (default SQL 0.35, Python 0.35, Resume 0.30)
  - completeness factor: penalize when any pillar is missing data
  - recency: half-life ~30 days on the assessment side
- Persist `weights` and `level` already exist in `readiness_history` — reuse.
- Snapshot every recompute; chart consumes `readiness_history`.

### 4. Database hardening (C6)
- Add FKs: `assessment_attempts.user_id`, `assessment_attempts.assessment_id`, `scores.attempt_id`, `scores.question_id`, `questions.assessment_id`, `resume_analyses.resume_id`, `recommendations.attempt_id`, `readiness_history.user_id`.
- Composite indexes on hot paths:
  - `assessment_attempts (user_id, completed_at desc)`
  - `scores (attempt_id)`, `scores (user_id, created_at desc)`
  - `readiness_history (user_id, computed_at desc)`
  - `recommendations (user_id, status, created_at desc)`
  - `skills (user_id)`

### Sprint 1 exit criteria
- DevTools can no longer reveal answers.
- Re-uploading a resume does not change the skills row count beyond new skills.
- Readiness reacts sensibly to a single-pillar improvement (no longer linear-thirds).

---

## Sprint 2 — Reliability & Coverage (C4, C5, C7, H3)

### 1. Server-side PDF extraction (C4)
- Move `extractPdfText` off the browser. New server fn `extractResumeText({ resumeId })` downloads from the `resumes` bucket via `supabaseAdmin` and parses with a Worker-compatible parser (e.g. `unpdf`).
- Falls back to a clear error when the PDF is image-only (flag for OCR follow-up, do not silently score 0).

### 2. Email queue health (C5)
- Add `/api/public/health/email-queue` returning pending count, oldest pending age, last cron run, last DLQ size.
- Surface a banner in `/admin` when oldest pending > 5 min or last cron > 10 min ago.
- Add a one-line cron self-check insert into `email_send_log` so absence of activity is itself a signal.

### 3. Consolidate resume analyzers (H3)
- Pick `analyzeResume` (AI) as primary. `analyzeResumeKeywords` becomes the deterministic fallback when the AI gateway errors or budget is exhausted.
- Tag every `resume_analyses` row with `method: 'ai' | 'rules'`.

### 4. AI cost guardrails (C7)
Note: backend rate-limiting primitives are limited; this will be ad-hoc.
- Per-user daily counters in a new `ai_usage` table (`user_id`, `day`, `function`, `count`).
- Soft cap (warn) and hard cap (refuse) per function for `analyzeResume`, `generateRoadmap`, `interviewTurn`.
- Return a clean 429-style payload the UI shows as "daily limit reached".

### Sprint 2 exit criteria
- 5 MB scanned resume returns a meaningful error, not score 0.
- Admin banner fires within 5 min of email cron stalling.
- A scripted abuse run against `interviewTurn` is refused after the daily cap.

---

## Sprint 3 — Polish, performance, accessibility (H4, H5, M1, M2, M3, M4, plus L wins)

### 1. Bundle slimming (H4)
- `React.lazy` Recharts and Framer Motion panels in `dashboard.tsx`, `progress.tsx`, `assessment.tsx`, `results.tsx`.
- Replace per-page Framer imports with a small `motion.ts` re-export so tree-shaking works.

### 2. Auth race / role flicker (H5)
- Cache role in `localStorage` with stale-while-revalidate inside `use-auth.tsx`.
- Clear cache on `signOut` (also fixes M4).

### 3. File decomposition (M1)
- Split `assessment.tsx` (435), `progress.tsx` (591), `dashboard.tsx` (467), `resume.tsx` (399) into route file + `use-*` hook + presentation components.

### 4. Design-token cleanup (M2)
- Sweep `from-blue-500/15`, `from-emerald-500/15`, hard-coded hex into semantic tokens in `src/styles.css`.

### 5. Per-route error/notFound (M3)
- Add `errorComponent` + `notFoundComponent` to every route with a loader; root gets `notFoundComponent`; `defaultErrorComponent` on the router.

### 6. Recommendations freshness (M5)
- Mark recommendations as `expired` when their pillar score crosses a threshold; hide expired by default in the UI.

### 7. Quick-win pass (L1–L8)
- Focus rings on all interactive elements.
- Replace color-only state with icon + label.
- Mobile `dashboard` table → cards under `sm`.
- Empty-state illustrations on Resume, Assessment, Roadmap.
- `aria-live` on toast region.
- Lighthouse pass; alt text and meta on all public routes.

### Sprint 3 exit criteria
- Lighthouse a11y ≥ 95 on `/`, `/dashboard`, `/assessment`.
- First-load JS for `/dashboard` < 250 KB gz.
- No file in `src/routes/_authenticated/` exceeds 250 LOC.

---

## Out of scope for V1 (track for V1.1)
- OCR pipeline for image-only PDFs.
- Multi-tenant recruiter/college dashboards beyond stubs.
- Live job-market scraping (`market_demand_seed` stays seeded).
- ML-based readiness model.

---

## Sequencing summary

```text
Week 1   Sprint 1: integrity, skills, readiness, FKs/indexes
Week 2   Sprint 2: server PDF, queue health, analyzer merge, AI caps
Week 3   Sprint 3: bundles, auth race, file split, a11y, quick wins
Week 4   Buffer: bug bash, pilot prep, observability (Sentry + log drain)
```

Composite score target after this plan: **8.0/10**, with no remaining items in the Critical bucket.
