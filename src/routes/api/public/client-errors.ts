import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Public ingestion endpoint for client-side runtime errors. Posted from
// the browser via sendBeacon (see src/lib/error-reporter.ts). Validated,
// length-capped, and written to public.system_events as severity=error
// with source='client-error'. Never returns details to caller.
const Body = z.object({
  kind: z.enum(["error", "unhandledrejection"]),
  message: z.string().min(1).max(500),
  stack: z.string().min(1).max(4000).optional(),
  source: z.string().min(1).max(256).optional(),
  lineno: z.number().int().min(0).max(10_000_000).optional(),
  colno: z.number().int().min(0).max(10_000_000).optional(),
  route: z.string().min(1).max(256).optional(),
  userAgent: z.string().min(1).max(256).optional(),
});

export const Route = createFileRoute("/api/public/client-errors")({
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

        const sb = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await sb.rpc("log_system_event", {
          _event_type: `client_${parsed.kind}`,
          _severity: "error",
          _source: "client-error",
          _route: parsed.route ?? null,
          _message: parsed.message,
          _latency_ms: null,
          _metadata: {
            stack: parsed.stack ?? null,
            source: parsed.source ?? null,
            lineno: parsed.lineno ?? null,
            colno: parsed.colno ?? null,
            userAgent: parsed.userAgent ?? null,
          } as never,
        });

        return new Response(null, { status: 204 });
      },
    },
  },
});
