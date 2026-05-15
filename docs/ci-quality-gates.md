# CI Quality Gates (Phase 2)

Phase 2 ships the runtime side of the quality gates (Web Vitals beacon,
gradient token consolidation). The CI side — axe-core a11y, bundle budget —
is documented here for the operator to wire into their pipeline.
The app does not require these to function; they are guardrails to prevent
regressions as Version 1 features land.

## 1. Web Vitals (already shipped, runtime)

- Browser hook: `src/lib/web-vitals.ts` (registered once in `__root.tsx`).
- Public endpoint: `POST /api/public/web-vitals` (validates with Zod, no PII).
- Storage: `public.system_events` rows with `source = 'web-vitals'`,
  `event_type = 'web_vital_<metric>'`. Severity:
  `good → info`, `needs-improvement → warn`, `poor → error`.
- Query latest:
  ```sql
  select created_at, event_type, severity, latency_ms, route, message
  from system_events
  where source = 'web-vitals'
  order by created_at desc limit 100;
  ```

## 2. Gradient Token Consolidation (already shipped)

New tokens in `src/styles.css`:
`--gradient-panel`, `--gradient-panel-soft`, `--gradient-panel-edge`,
`--gradient-header-dark`, `--gradient-hero-veil-top`,
`--gradient-hero-veil-strong`, `--gradient-hero-veil-bottom`,
`--gradient-hero-glow`. Use these instead of inline `linear-gradient(...)`.

## 3. axe-core A11y Gate (CI to wire)

```bash
npm i -D @axe-core/playwright @playwright/test
npx playwright install --with-deps chromium
```

`tests/a11y.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = ["/", "/services", "/research", "/solutions"];

for (const route of ROUTES) {
  test(`a11y ${route}`, async ({ page }) => {
    await page.goto(`http://localhost:3000${route}`);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
```

Run:

```bash
(npm run dev &) && sleep 8 && npx playwright test
```

Authenticated routes (`/dashboard`, `/resume`, etc.) require a seeded test
user — add a `beforeAll` that signs in via `supabase-js` and reuses the
auth state.

## 4. Bundle Budget (CI to wire)

```bash
npm i -D rollup-plugin-visualizer
```

Add to `vite.config.ts`:

```ts
import { visualizer } from "rollup-plugin-visualizer";
// ...
plugins: [
  // ... existing plugins
  visualizer({ filename: "dist/stats.html", gzipSize: true }),
]
```

Then in CI, after build:

```bash
main=$(find dist -name "main-*.js" -printf "%s\n" | sort -n | tail -1)
# ~3:1 gzip ratio for JS — fail above ~1.05 MB raw (~ 350 KB gzipped)
if [ "$main" -gt 1100000 ]; then
  echo "main bundle exceeds 350KB gz budget"; exit 1;
fi
```

## Where to monitor in production

- **Web Vitals**: admin diagnostics page → System Events → filter
  `source = web-vitals`, sort by `latency_ms desc`.
- **A11y regressions**: only caught at CI; nothing runtime to check.
- **Bundle creep**: only caught at CI; nothing runtime to check.