import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/health/email-queue")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
          return Response.json(
            { ok: false, error: "supabase env missing" },
            { status: 500 },
          );
        }
        const supabase = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recent, error } = await supabase
          .from("email_send_log")
          .select("status,created_at,template_name")
          .gte("created_at", since)
          .limit(1000);

        if (error) {
          return Response.json(
            { ok: false, error: error.message },
            { status: 500 },
          );
        }

        const counts = { pending: 0, sent: 0, failed: 0, dlq: 0, other: 0 };
        for (const r of recent ?? []) {
          const s = (r.status as string) ?? "other";
          if (s in counts) (counts as any)[s] += 1;
          else counts.other += 1;
        }

        const { data: state } = await supabase
          .from("email_send_state")
          .select("retry_after_until,batch_size,send_delay_ms,updated_at")
          .eq("id", 1)
          .maybeSingle();

        const rateLimited =
          !!state?.retry_after_until &&
          new Date(state.retry_after_until).getTime() > Date.now();

        const dlqRate =
          (counts.sent + counts.dlq + counts.failed) > 0
            ? counts.dlq / (counts.sent + counts.dlq + counts.failed)
            : 0;

        const ok = !rateLimited && dlqRate < 0.25;

        return Response.json({
          ok,
          window_minutes: 60,
          counts,
          dlq_rate: Number(dlqRate.toFixed(3)),
          rate_limited: rateLimited,
          retry_after_until: state?.retry_after_until ?? null,
          batch_size: state?.batch_size ?? null,
          send_delay_ms: state?.send_delay_ms ?? null,
          state_updated_at: state?.updated_at ?? null,
          checked_at: new Date().toISOString(),
        });
      },
    },
  },
});
