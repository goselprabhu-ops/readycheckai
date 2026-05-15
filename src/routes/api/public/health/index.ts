import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Lightweight uptime probe: verifies env, DB reachability, and core tables.
// Safe for external uptime monitors (UptimeRobot, BetterStack, etc.).
export const Route = createFileRoute("/api/public/health/")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const env_ok = !!url && !!key && !!process.env.LOVABLE_API_KEY;
        if (!url || !key) {
          return Response.json(
            { ok: false, env_ok: false, error: "supabase env missing" },
            { status: 500 },
          );
        }
        const sb = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const t0 = Date.now();
        const { error: dbErr } = await sb
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .limit(1);
        const db_latency_ms = Date.now() - t0;
        const db_ok = !dbErr;

        return Response.json({
          ok: env_ok && db_ok,
          env_ok,
          db_ok,
          db_latency_ms,
          db_error: dbErr?.message ?? null,
          version: process.env.GIT_COMMIT ?? null,
          checked_at: new Date().toISOString(),
        });
      },
    },
  },
});