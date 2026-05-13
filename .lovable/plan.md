## Goal

Ship a Student MVP of the AI Employability Intelligence platform with the foundation for the other four roles (College, Recruiter, Training Institute, Government). Visual style: **Precision Tech Lab** (indigo `#6366F1` brand, cyan `#22D3EE` accent, Space Grotesk display + Inter body, rounded-3xl cards, soft slate canvas).

## Scope of this first build

In scope:
- Public landing page explaining the platform + role selector
- Email/password + Google auth (Lovable Cloud)
- Role system with 5 roles; profile auto-created on signup; Student dashboard wired up
- Resume upload + AI-powered ATS analysis (resume strength, keyword gaps, suggestions)
- Skill assessment runner (SQL / Python / Analytics MCQs) with scoring
- Employability score dashboard (composite + sub-scores + market fit panel)
- AI-generated learning roadmap based on gaps
- AI mock interview chat
- Stub dashboards for Recruiter / College / Institute / Government roles (so role switching works end-to-end, full features come later)

Out of scope (clearly deferred):
- Live job-market scraping (we'll seed a small market dataset; live ingestion later)
- Multi-agent orchestration internals (single AI server fn per task for now)
- Recruiter candidate filtering UI, college placement tracking, gov analytics — placeholders only
- Predictive employability ML model — derived heuristically from sub-scores for now

## User experience

```
/                       Landing (hero, modules, role selector, CTA)
/login, /signup         Auth (email+password, Google)
/_authenticated/...     Protected app with sidebar shell
  /dashboard            Student employability overview
  /resume               Upload + ATS analysis history
  /skills               Assessment runner + skill matrix
  /roadmap              Personalized learning path
  /interview            AI mock interview chat
  /recruiter            Recruiter stub (visible only to recruiter role)
  /college              College admin stub
  /institute            Training institute stub
  /gov                  Government analytics stub
  /settings             Profile + role
```

Sidebar uses shadcn `Sidebar` (collapsible icon mode), nav items filtered by current role. Header shows role switcher (only roles assigned to the user) + avatar.

## Data model (Lovable Cloud / Postgres)

- `app_role` enum: `student | recruiter | college_admin | institute_admin | gov_admin`
- `profiles` (id = auth.users.id, full_name, avatar_url, headline, college, year)
- `user_roles` (id, user_id, role) — separate table per security rules; `has_role()` security-definer fn
- `resumes` (id, user_id, file_path, original_name, uploaded_at)
- `resume_analyses` (id, resume_id, ats_score, strengths jsonb, gaps jsonb, keywords jsonb, summary, created_at)
- `assessments` (id, user_id, topic, score, total, breakdown jsonb, created_at)
- `skills` (id, user_id, name, level int, source) — derived from assessments + resume
- `roadmap_items` (id, user_id, title, description, status, est_minutes, order_index, created_at)
- `interview_sessions` (id, user_id, role_target, created_at)
- `interview_messages` (id, session_id, role text, content, created_at)
- `employability_scores` (id, user_id, composite, resume_score, skills_score, market_fit, computed_at)
- `market_demand_seed` (id, role, skill, demand_score) — small seeded dataset for market fit + chart

Storage bucket: `resumes` (private, RLS by owner).

RLS: every user-scoped table allows `auth.uid() = user_id`; admin roles get read access via `has_role()` (scaffolded, not yet exposed in UI).

## Server functions (TanStack `createServerFn`)

- `analyzeResume({ resumeId })` — fetches PDF text, calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured `Output.object` schema → ATS score + strengths/gaps/keywords. Persists to `resume_analyses`.
- `generateAssessment({ topic })` — AI returns 10 MCQs with answers (cached per topic/day to limit cost).
- `submitAssessment({ topic, answers })` — scores, writes `assessments`, updates `skills`.
- `recomputeEmployability()` — derives composite from latest resume_analysis + assessments + market_demand_seed; writes `employability_scores`.
- `generateRoadmap()` — AI takes gaps + target role → ordered roadmap items.
- `interviewTurn({ sessionId, message })` — streams assistant turn via `streamText` + `toUIMessageStreamResponse`.

All AI calls go through a shared `src/lib/ai-gateway.ts` helper using `@ai-sdk/openai-compatible` with `LOVABLE_API_KEY`.

## Design system

Update `src/styles.css` tokens (oklch equivalents of):
- `--primary` indigo `#6366F1`, `--accent` cyan `#22D3EE`
- `--background` slate-50, cards white with `border-slate-200`, `rounded-3xl`
- Display font Space Grotesk, body Inter (loaded in `__root.tsx` head)
- Reusable: `ScoreRing` (SVG circular score), `StatCard`, `ChatBubble`, `RoadmapStep`

Strict semantic tokens — no raw `text-white` / `bg-black` in components.

## Build sequence

1. Enable Lovable Cloud
2. Design tokens + fonts + sidebar shell (`__root` provider, `_authenticated` layout, `AppSidebar`)
3. Landing page + auth pages (email/password + Google) + profile/role bootstrap trigger
4. DB migration: enum, profiles, user_roles, has_role, all tables, RLS, storage bucket
5. Student dashboard with mock data wired to real `employability_scores`
6. Resume upload → storage → `analyzeResume` server fn → results page
7. Skill assessment runner (generate + submit)
8. Roadmap page (generate + persist + complete steps)
9. AI mock interview chat (streaming)
10. Role-stub pages + role switcher in header

## Technical notes (for reference)

- TanStack Start file-based routes; protected pages under `src/routes/_authenticated/`
- `beforeLoad` gates loader on `supabase.auth.getUser()` to avoid 401 race
- Roles enforced via `has_role()` in RLS + a `requireRole` server-fn middleware wrapper
- Interview uses AI SDK `useChat` with `DefaultChatTransport({ api: '/api/chat' })` server route
- One assigned role at signup (default `student`); admins can grant additional roles later

## Deferred for follow-ups

Recruiter candidate search, college placement pipeline, training-institute benchmarking, gov workforce analytics, live job feed ingestion, multi-agent orchestrator, prediction ML model, billing, notifications.
