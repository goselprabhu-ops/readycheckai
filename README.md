# ReadyCheck Lab

AI-powered employability intelligence for students, colleges and recruiters.
Measure SQL, Python and resume readiness, follow personalized roadmaps,
practice mock interviews, and track growth — all in one workspace.

## Stack

- **Framework**: TanStack Start v1 (React 19, Vite 7, SSR on Cloudflare Workers)
- **Styling**: Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Charts**: Recharts
- **Backend**: Lovable Cloud (managed Supabase) — Auth, Postgres + RLS, Storage
- **AI**: Lovable AI Gateway (no API key required)

## Modules

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page |
| `/login` · `/signup` · `/forgot-password` | Authentication |
| `/dashboard` | Readiness overview, scores, recommendations |
| `/assessment` | SQL & Python multiple-choice assessments with timer |
| `/resume` | PDF resume upload + ATS-style keyword analysis |
| `/roadmap` | Adaptive learning roadmap |
| `/interview` | AI mock interview chat |
| `/results` | Detailed assessment review |
| `/progress` | Growth analytics across all modules |
| `/admin` | Admin panel (role-gated) |

## Local development

```bash
bun install
bun dev
```

The app uses Lovable Cloud for the backend — no local Supabase setup required.
Environment variables (`VITE_SUPABASE_*`) are auto-injected.

## Project structure

```
src/
├── routes/                 # File-based routes (TanStack Router)
│   ├── _authenticated/     # Protected routes (auth gate in _authenticated.tsx)
│   └── api/                # Server routes (HTTP endpoints)
├── components/             # Reusable UI components
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── *.functions.ts      # createServerFn handlers (RPC)
│   ├── *.server.ts         # Server-only helpers
│   └── readiness.ts        # Pure scoring logic
├── integrations/supabase/  # AUTO-GENERATED — never edit
└── styles.css              # Design tokens (oklch)
```

## Server-side patterns

- App-internal logic → `createServerFn` (`src/lib/*.functions.ts`)
- Auth-protected → `.middleware([requireSupabaseAuth])`
- Webhooks / external HTTP → `src/routes/api/public/*`
- Never use Supabase Edge Functions on this stack

## Database

Schema lives in `supabase/migrations/`. Key tables:

- `profiles`, `user_roles` — accounts & RBAC
- `assessment_definitions`, `questions`, `assessment_attempts`, `scores`
- `assessments` — per-topic score snapshots used by dashboards
- `resumes`, `resume_analyses`, `skills`
- `readiness_history`, `employability_scores`
- `recommendations`, `roadmap_items`
- `interview_sessions`, `interview_messages`

RLS is enabled on every user-data table; policies scope rows to `auth.uid()`.

## Deployment

1. Click **Publish** in the top-right of the Lovable editor.
2. Frontend changes go live after clicking **Update** in the publish dialog.
3. Backend changes (migrations, server functions) deploy automatically.
4. To attach a custom domain: Project Settings → Domains.

Production URL: <https://readycheckai.lovable.app>

## SEO

- Per-route `head()` meta with title, description, og:* and canonical
- Sitemap: `/sitemap.xml` (server route, auto-updated)
- `public/robots.txt` allows marketing pages, disallows authenticated app
- JSON-LD `Organization` schema on the landing page

## Demo accounts

Sign up with any email. The first signup is granted `student` automatically;
to grant `admin`, insert into `public.user_roles` via the Lovable Cloud
console (Database → user_roles).

## License

Proprietary — © Stride.AI