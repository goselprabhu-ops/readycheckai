## V1 Architecture Refactor — Plan

Goal: prepare ReadyCheck Lab for V1 expansion (analytics careers focus) without breaking the shipped MVP. This is **scaffolding + light refactor**, not a feature build. New V1 features (Phase A–E) ship in follow-up turns onto this foundation.

### Current state (audit)
- Routes: flat under `src/routes/` and `src/routes/_authenticated/` — already correct for TanStack Start.
- Components: flat under `src/components/` — feature components mixed with shell components.
- Lib: flat under `src/lib/` — server fns and client helpers mixed.
- Auth/RLS already wired (`_authenticated.tsx` layout, `has_role`, admin route uses role check).
- Existing primitives: shadcn `ui/`, sidebar (`app-sidebar`), header/footer, charts, score-ring, panels, sonner toasts.

### Scope of this turn

Pure scaffolding. **No route moves, no behavior changes, no MVP regressions.** Everything below is additive — existing imports keep working.

#### 1. Feature folders (additive)
Create empty/index-only barrels under `src/features/` for the V1 domains. Existing code stays where it is; new V1 code lands here.
```
src/features/
  resume/        index.ts
  assessments/   index.ts
  interview/     index.ts
  readiness/     index.ts
  roadmap/       index.ts
  profile/       index.ts
  admin/         index.ts
  recruiter/     index.ts
  institution/   index.ts
```
Each `index.ts` re-exports the matching existing modules (e.g. `resume/index.ts` → `export * from "@/lib/resume.functions"`). Pure aliasing, zero moves.

#### 2. Shared layer
```
src/shared/
  types/           # cross-feature TS types (Role, ReadinessPillar, etc.)
    roles.ts       # 'data_analyst' | 'business_analyst' | 'bi_analyst' | 'jr_data_scientist'
    readiness.ts   # pillar + score shapes
    api.ts         # generic ApiResult<T>, Paginated<T>
    index.ts
  api/
    client.ts      # thin wrapper around supabase + useServerFn helpers (centralized error → toast)
    query-keys.ts  # canonical react-query keys
  config/
    theme.ts       # design tokens map (reads from styles.css vars)
    nav.ts         # single source of truth for sidebar + top-nav items
    roles.ts       # role display labels + icons
```

#### 3. Reusable UI system (`src/components/common/`)
New presentational primitives, all built on shadcn/ui + design tokens. No new colors — uses existing `--primary`, `--card`, etc.
- `MetricCard` — KPI card (label, value, delta, icon) — replaces ad-hoc cards
- `SectionCard` — titled card with optional action slot
- `EmptyState` — icon + title + description + CTA
- `LoadingSkeleton` — variants: `card`, `list`, `chart`, `table`, `ring`
- `ChartContainer` — wraps recharts with title/legend/loading/empty
- `Modal` — typed wrapper around shadcn Dialog (controlled + form-friendly)
- `FormField` — label + control + error + hint, react-hook-form ready
- `PageHeader` — h1 + breadcrumb + actions
- `RoleBadge` — colored chip per analytics role
- `ScorePill` — small readiness % pill
- `DataTable` — minimal wrapper with loading/empty/sort

#### 4. Dashboard shell
```
src/components/layouts/
  DashboardShell.tsx   # sidebar + top nav + outlet, mobile drawer
  TopNav.tsx           # breadcrumbs, user menu, notifications slot
  PageContainer.tsx    # max-w + padding wrapper
```
`DashboardShell` is opt-in. `_authenticated.tsx` keeps current behavior; new V1 routes wrap with `DashboardShell`. Existing routes can migrate one-by-one in later phases.

#### 5. Error boundary + toast system
- `src/components/common/ErrorBoundary.tsx` — class boundary that reports via existing `error-reporter.ts`, renders `ErrorFallback`.
- `src/components/common/ErrorFallback.tsx` — friendly fallback with retry.
- `src/shared/api/toast.ts` — `notify.success/error/info/promise(...)` thin wrapper around sonner so feature code never imports sonner directly.

#### 6. Role-based route protection
- Add `src/components/layouts/RoleGate.tsx` — client gate that checks `useUserRoles()` and renders fallback or children.
- Add `src/shared/api/roles.ts` — `useUserRoles()` hook backed by a new `getMyRoles` server fn (queries `user_roles` via `requireSupabaseAuth`).
- Existing `admin.tsx` keeps its server-side check; `RoleGate` is for in-page conditional UI (nav items, action buttons).

#### 7. Theme & design tokens
- Audit `src/styles.css` — confirm tokens cover: surfaces, primary/accent, success/warn/danger, chart palette (5 colors), radius scale, shadow scale.
- Add missing chart colors as `--chart-1..5` if absent. No visual changes to existing screens.
- `src/shared/config/theme.ts` — TS export of the same tokens for chart components and runtime usage.

#### 8. Global state
Lightweight — no Redux. Add:
- `src/shared/state/user-context.tsx` — provides `{ user, profile, roles, refresh }` to the authenticated tree, sourced from existing profile fns. Replaces scattered `useQuery(profile)` calls over time.
- React Query already wired; document canonical query keys in `query-keys.ts`.

### Technical details

**File-by-file additions** (~25 new files, 0 deletions, ~3 small edits):

New:
- `src/features/{resume,assessments,interview,readiness,roadmap,profile,admin,recruiter,institution}/index.ts` (9)
- `src/shared/types/{roles,readiness,api,index}.ts` (4)
- `src/shared/api/{client,query-keys,toast,roles}.ts` (4)
- `src/shared/config/{theme,nav,roles}.ts` (3)
- `src/shared/state/user-context.tsx` (1)
- `src/components/common/{MetricCard,SectionCard,EmptyState,LoadingSkeleton,ChartContainer,Modal,FormField,PageHeader,RoleBadge,ScorePill,DataTable,ErrorBoundary,ErrorFallback}.tsx` (13)
- `src/components/layouts/{DashboardShell,TopNav,PageContainer,RoleGate}.tsx` (4)
- `src/lib/roles.functions.ts` — `getMyRoles` server fn (1)
- `docs/v1-architecture.md` — folder map + conventions (1)

Edits (surgical):
- `src/styles.css` — add `--chart-1..5` if missing
- `src/routes/__root.tsx` — wrap with top-level `ErrorBoundary`
- No edits to MVP feature routes/components

**Conventions documented in `docs/v1-architecture.md`:**
- New features go in `src/features/<name>/{components,hooks,functions.ts}`
- Cross-feature primitives → `src/components/common/`
- Server fns: `*.functions.ts` (existing pattern preserved)
- Imports always via `@/` alias
- All new colors via tokens only

### Out of scope (deferred to Phase A–E)
- Per-role match %, ATS sub-scores, AI rewrite (Phase A)
- Power BI / Excel / Statistics tracks (Phase B)
- Public profile, badges (Phase C)
- Question CRUD, recruiter search, market signals (Phase D)
- Stripe, E2E (Phase E)
- Migrating existing routes onto `DashboardShell` (incremental, per phase)

### Verification
- Build passes (typecheck strict)
- All existing routes render unchanged
- New common components render in isolation (no consumers yet)
- `getMyRoles` returns current user's roles
