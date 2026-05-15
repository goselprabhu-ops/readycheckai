import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Public ingestion endpoint for Web Vitals beacons sent from the browser
// via `navigator.sendBeacon`. Writes to public.system_events with
// source='web-vitals'. Locked-down: shape-validated, no PII, severity
// derived from the metric rating ("good" → info, "needs-improvement" →
// warn, "poor" → error).
const Body = z.object({
  name: z.enum(["CLS", "INP", "LCP", "FCP", "TTFB"]),
  value: z.number().finite().min(0).max(60_000),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  id: z.string().min(1).max(128).optional(),
  navigationType: z.string().min(1).max(32).optional(),
  route: z.string().min(1).max(256).optional(),
});

export const Route = createFileRoute("/api/public/web-vitals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return new Response("env", { status: 500 });

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("bad request", { status: 400 });
        }

        const severity =
          parsed.rating === "poor"
            ? "error"
            : parsed.rating === "needs-improvement"
              ? "warn"
              : "info";

        const sb = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await sb.rpc("log_system_event", {
          _event_type: `web_vital_${parsed.name.toLowerCase()}`,
          _severity: severity,
          _source: "web-vitals",
          _route: parsed.route ?? null,
          _message: parsed.rating ?? null,
          _latency_ms: Math.round(parsed.value),
          _metadata: {
            metric: parsed.name,
            value: parsed.value,
            id: parsed.id ?? null,
            navigationType: parsed.navigationType ?? null,
          } as never,
        });

        return new Response(null, { status: 204 });
      },
    },
  },
});