# ReadyCheck Lab — V1 Architecture

This document describes the scaffolding introduced to prepare the platform
for V1 (analytics employability intelligence). The MVP code is preserved
as-is; new V1 work lands in the structures below.

## Folder map

```
src/
  features/                 # V1 feature barrels (re-export MVP modules)
    resume/        index.ts
    assessments/   index.ts
    interview/     index.ts
    readiness/     index.ts
    roadmap/       index.ts
    profile/       index.ts
    admin/         index.ts
    recruiter/     index.ts (placeholder, Phase D)
    institution/   index.ts (placeholder, Phase D)

  shared/
    types/         # Cross-feature TypeScript types
      roles.ts     # AppRole, AnalyticsRole
      readiness.ts # ReadinessPillar, ReadinessSummary
      api.ts       # ApiResult<T>, Paginated<T>
    api/
      client.ts    # Re-export of supabase + withErrorToast helper
      query-keys.ts# Canonical react-query keys
      roles.ts     # useUserRoles() hook (server fn backed)
      toast.ts     # notify.success/error/info wrapper around sonner
    config/
      theme.ts     # Design tokens mirror (CSS variable references)
      nav.ts       # DASHBOARD_NAV, NAV_GROUP_LABELS
      roles.ts     # ANALYTICS_ROLE_CONFIG
    state/
      user-context.tsx  # Curated user surface over useAuth()

  components/
    common/        # Reusable presentational primitives
      MetricCard, SectionCard, EmptyState, LoadingSkeleton,
      ChartContainer, Modal, FormField, PageHeader,
      RoleBadge, ScorePill, DataTable,
      ErrorBoundary, ErrorFallback
    layouts/       # Page-level shells
      DashboardShell, TopNav, PageContainer, RoleGate

  lib/             # MVP server functions + helpers (preserved)
  routes/          # TanStack Start file routes (preserved)
```

## Conventions

- **New feature code** lives in `src/features/<name>/` and may add
  `components/`, `hooks/`, `<name>.functions.ts` server fns over time.
- **Cross-feature primitives** live in `src/components/common/`. Never
  import sonner / shadcn dialogs / lucide icons directly in feature code
  when a `common` wrapper exists.
- **Server functions** keep the `*.functions.ts` filename convention so
  Vite's import-protection rules continue to apply.
- **Imports** use the `@/` path alias.
- **Colors**: never hard-code colors. Use semantic tokens from
  `src/styles.css` or `themeTokens` from `@/shared/config/theme`.
- **Toasts**: import from `@/shared/api/toast` (`notify.success(...)`).
- **Roles in UI**: gate with `<RoleGate anyOf={[...]}>`; in server fns
  rely on RLS + `requireSupabaseAuth`.
- **react-query keys**: use helpers from `@/shared/api/query-keys`.

## Migration policy

Existing MVP routes (`/dashboard`, `/resume`, `/assessment`, etc.)
continue to use their current shells. They will migrate onto
`<DashboardShell>` incrementally as each Phase A–E feature lands. No
blanket rewrite is planned.

## What's NOT in this scaffolding

- Per-role match %, ATS sub-scores (Phase A)
- New assessment tracks (Phase B)
- Public profile, badges (Phase C)
- Question CRUD, recruiter search, market signals (Phase D)
- Stripe + entitlements (Phase E)

These ship as feature work directly into `src/features/<name>/` on top of
the primitives above.