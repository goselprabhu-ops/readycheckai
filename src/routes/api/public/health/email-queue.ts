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

        const now = Date.now();
        const since = new Date(now - 60 * 60 * 1000).toISOString();
        const { data: recent, error } = await supabase
          .from("email_send_log")
          .select("message_id,status,created_at,template_name")
          .gte("created_at", since)
          .limit(1000);

        if (error) {
          return Response.json(
            { ok: false, error: error.message },
            { status: 500 },
          );
        }

        // Deduplicate by message_id — keep the latest row per email.
        const latestByMsg = new Map<string, { status: string; created_at: string }>();
        let lastActivity: number = 0;
        for (const r of recent ?? []) {
          const ts = new Date(r.created_at).getTime();
          if (ts > lastActivity) lastActivity = ts;
          const key = (r.message_id as string) ?? `${r.created_at}:${r.status}`;
          const prev = latestByMsg.get(key);
          if (!prev || new Date(prev.created_at).getTime() < ts) {
            latestByMsg.set(key, { status: r.status as string, created_at: r.created_at as string });
          }
        }

        const counts = { pending: 0, sent: 0, failed: 0, dlq: 0, other: 0 };
        let oldestPendingTs: number | null = null;
        for (const r of latestByMsg.values()) {
          const s = r.status ?? "other";
          if (s in counts) (counts as any)[s] += 1;
          else counts.other += 1;
          if (s === "pending") {
            const ts = new Date(r.created_at).getTime();
            if (oldestPendingTs === null || ts < oldestPendingTs) oldestPendingTs = ts;
          }
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

        const oldestPendingAgeSec =
          oldestPendingTs !== null ? Math.round((now - oldestPendingTs) / 1000) : 0;
        const lastActivityAgeSec =
          lastActivity > 0 ? Math.round((now - lastActivity) / 1000) : null;

        // Stalled = pending email older than 5 min, or no log activity for 10 min
        // when we should expect cron to be writing. The latter is a proxy for
        // "cron died" since the dispatcher writes on every run.
        const pendingStalled = oldestPendingAgeSec > 5 * 60;
        const cronStalled =
          lastActivityAgeSec !== null && lastActivityAgeSec > 10 * 60 && counts.pending > 0;

        const ok = !rateLimited && !pendingStalled && !cronStalled && dlqRate < 0.25;

        return Response.json({
          ok,
          window_minutes: 60,
          counts,
          oldest_pending_age_seconds: oldestPendingAgeSec,
          last_activity_age_seconds: lastActivityAgeSec,
          pending_stalled: pendingStalled,
          cron_stalled: cronStalled,
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
