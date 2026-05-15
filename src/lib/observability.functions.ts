import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Admin-only system diagnostics. Returns an aggregate health snapshot:
 * env presence, DB reachability, recent error/critical events, queue and
 * AI usage signals, and counts of failed resume analyses.
 *
 * Authenticated middleware ensures we have a session; the underlying RPC
 * verifies the admin role.
 */
export const getSystemDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // 1. summary via SECURITY DEFINER (admin check inside)
    const { data: summary, error: summaryErr } = await supabase.rpc(
      "system_health_summary",
    );
    if (summaryErr) {
      throw new Error(summaryErr.message);
    }

    // 2. env / version snapshot (server-side)
    const env = {
      supabase_url: !!process.env.SUPABASE_URL,
      service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      lovable_api_key: !!process.env.LOVABLE_API_KEY,
      twilio: !!process.env.TWILIO_API_KEY,
      msg91: !!process.env.MSG91_AUTH_KEY,
    };

    // 3. DB ping
    const t0 = Date.now();
    const { error: pingErr } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);
    const db = { ok: !pingErr, latency_ms: Date.now() - t0, error: pingErr?.message ?? null };

    // 4. resume analysis health (last 24h)
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: resumeRows } = await supabaseAdmin
      .from("resume_analyses")
      .select("parser_status, method, created_at")
      .gte("created_at", since)
      .limit(1000);
    const resume = {
      total: resumeRows?.length ?? 0,
      failed:
        resumeRows?.filter((r) =>
          r.parser_status && r.parser_status !== "ok",
        ).length ?? 0,
      by_method: (resumeRows ?? []).reduce<Record<string, number>>((acc, r) => {
        const k = (r.method as string) ?? "unknown";
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
    };

    // 5. AI usage today
    const today = new Date().toISOString().slice(0, 10);
    const { data: aiRows } = await supabaseAdmin
      .from("ai_usage_daily")
      .select("feature, count")
      .eq("day", today);
    const ai_usage_today = (aiRows ?? []).reduce<Record<string, number>>(
      (acc, r) => {
        acc[r.feature as string] = (acc[r.feature as string] ?? 0) + (r.count as number);
        return acc;
      },
      {},
    );

    return {
      checked_at: new Date().toISOString(),
      env,
      db,
      resume,
      ai_usage_today,
      summary: (summary ?? {}) as unknown as Record<string, never>,
    };
  });