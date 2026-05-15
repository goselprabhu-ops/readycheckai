# Architecture & Performance

## Folder layout

```
src/
  routes/                # TanStack Start file-based routes (page-level)
  routes/api/public/     # External-facing HTTP endpoints (webhooks, health)
  components/            # Reusable UI (presentational)
  components/charts/     # Heavy Recharts implementations (lazy-loaded)
  components/ui/         # shadcn primitives
  lib/                   # Domain logic, server functions, services
    *.functions.ts       # createServerFn entry points (RPC boundary)
    *.server.ts          # Server-only helpers (admin client, etc.)
    readiness-engine.ts  # Pure scoring service (testable, isomorphic)
    resume-pipeline.ts   # Resume extraction/analysis pipeline
    observability.ts     # Structured logging + system_events recorder
    security.ts          # Cooldowns, audit logging
    ai-guardrails.ts     # Per-user AI quotas
  hooks/                 # Reusable React hooks
  integrations/supabase/ # Auto-generated client + auth middleware
```

## Code splitting

- TanStack Start auto-splits route components — components defined inside
  route files don't need manual splitting.
- Recharts (~80kb gz) is the heaviest third-party dep. All chart consumers
  go through `@/components/dashboard-charts`, `@/components/progress-charts`,
  or `@/components/charts/_readiness-trend` — each is `React.lazy()`-wrapped
  so Recharts only ships when a chart actually renders. Suspense fallbacks
  show a skeleton block during the chunk fetch.
- Heavy chart implementations live in `src/components/charts/_*-impl.tsx`
  with internal-prefix names; the public modules re-export Suspense-wrapped
  lazy versions so callers don't change.

## Memoization & rendering

- Server functions return plain DTOs and are cached by TanStack Query where
  used; loaders should call serverFns rather than query the DB directly.
- Use `useMemo` for derived chart data and rule evaluation in panels.
- Use `React.memo` on presentational components that receive stable props
  from a parent that re-renders often.

## Performance monitoring

- Server-side: `withTiming()` in `src/lib/observability.ts` wraps async work
  and emits `slow_op` warnings (>2s) plus error captures into `system_events`.
- Frontend: hook in Web Vitals via `web-vitals` if needed; surface in
  `/admin` System Diagnostics. No SDK installed by default — add Sentry or
  PostHog when shipping to scale.

## Bundle hygiene

- Centralize Framer Motion imports through `src/lib/motion.ts`. To shrink
  further, swap to `motion/react` `LazyMotion` (requires `m.*` instead of
  `motion.*` — defer until profiling shows it's the bottleneck).
- Avoid named imports from `lucide-react` larger than ~10 icons per file;
  it auto-tree-shakes but bundlers occasionally regress.
- Server-only modules end in `.server.ts` and never import client SDKs at
  module scope.