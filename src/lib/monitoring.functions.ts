import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Admin-only cost & usage monitoring. Aggregates the platform's billable
 * subscriptions in one snapshot: AI gateway calls, OTP sends (Twilio/MSG91),
 * hosting/DB load, and paid-subscription revenue.
 *
 * Auth middleware verifies a session; the admin role check is enforced by
 * the underlying `system_health_summary` RPC and the additional check below.
 */
export const getPlatformMonitoring = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Re-verify admin role on the request principal (defense in depth).
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      throw new Error("forbidden");
    }

    const now = Date.now();
    const since30d = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
    const since24h = new Date(now - 24 * 3600 * 1000).toISOString();
    const since60s = new Date(now - 60_000).toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const since30dDay = new Date(now - 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    // ---------- AI ----------
    const [aiTodayRes, aiMonthRes, cacheStatsRes] = await Promise.all([
      supabaseAdmin
        .from("ai_usage_daily")
        .select("feature, count")
        .eq("day", today),
      supabaseAdmin
        .from("ai_usage_daily")
        .select("feature, count, day")
        .gte("day", since30dDay),
      supabaseAdmin
        .from("ai_response_cache")
        .select("feature, hit_count, model"),
    ]);

    const ai_today = (aiTodayRes.data ?? []).reduce<Record<string, number>>(
      (acc, r) => {
        const f = String(r.feature);
        acc[f] = (acc[f] ?? 0) + Number(r.count ?? 0);
        return acc;
      },
      {},
    );
    const ai_month_total = (aiMonthRes.data ?? []).reduce(
      (sum, r) => sum + Number(r.count ?? 0),
      0,
    );
    const ai_month_by_feature = (aiMonthRes.data ?? []).reduce<
      Record<string, number>
    >((acc, r) => {
      const f = String(r.feature);
      acc[f] = (acc[f] ?? 0) + Number(r.count ?? 0);
      return acc;
    }, {});

    const cache_entries = cacheStatsRes.data?.length ?? 0;
    const cache_hits = (cacheStatsRes.data ?? []).reduce(
      (s, r) => s + Number(r.hit_count ?? 0),
      0,
    );
    const cache_hit_rate =
      ai_month_total + cache_hits > 0
        ? Math.round((cache_hits / (ai_month_total + cache_hits)) * 100)
        : 0;

    // ---------- OTP ----------
    const [otp24hRes, otp30dRes] = await Promise.all([
      supabaseAdmin
        .from("phone_otps")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabaseAdmin
        .from("phone_otps")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30d),
    ]);
    const otp_provider =
      process.env.MSG91_AUTH_KEY ? "MSG91" : process.env.TWILIO_API_KEY ? "Twilio" : "—";

    // ---------- Subscriptions / Revenue ----------
    const [activeSubsRes, monthSubsRes] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("id, status, environment, price_id, current_period_end")
        .in("status", ["active", "trialing", "past_due"]),
      supabaseAdmin
        .from("subscriptions")
        .select("id, created_at, environment, status")
        .gte("created_at", since30d),
    ]);

    const active_live = (activeSubsRes.data ?? []).filter(
      (s) => s.environment === "live",
    ).length;
    const active_sandbox = (activeSubsRes.data ?? []).filter(
      (s) => s.environment === "sandbox",
    ).length;
    const new_subs_30d = (monthSubsRes.data ?? []).filter(
      (s) => s.environment === "live",
    ).length;
    const sub_by_plan = (activeSubsRes.data ?? []).reduce<Record<string, number>>(
      (acc, s) => {
        const k = String(s.price_id ?? "unknown");
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      },
      {},
    );

    // ---------- Hosting / DB ----------
    const dbPingT0 = Date.now();
    const { error: pingErr, count: profilesCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const db_latency_ms = Date.now() - dbPingT0;

    const [
      eventsRes,
      errors24hRes,
      reqLastMinRes,
      resumeAnalysesRes,
      interviewMsgRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("platform_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabaseAdmin
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h)
        .in("severity", ["error", "critical"]),
      supabaseAdmin
        .from("platform_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since60s),
      supabaseAdmin
        .from("resume_analyses")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("interview_messages")
        .select("id", { count: "exact", head: true }),
    ]);

    return {
      checked_at: new Date().toISOString(),
      ai: {
        today: ai_today,
        today_total: Object.values(ai_today).reduce((a, b) => a + b, 0),
        month_total: ai_month_total,
        month_by_feature: ai_month_by_feature,
        cache_entries,
        cache_hits,
        cache_hit_rate,
      },
      otp: {
        provider: otp_provider,
        sent_24h: otp24hRes.count ?? 0,
        sent_30d: otp30dRes.count ?? 0,
      },
      subscriptions: {
        active_live,
        active_sandbox,
        new_subs_30d,
        by_plan: sub_by_plan,
      },
      hosting: {
        db_ok: !pingErr,
        db_latency_ms,
        profiles_count: profilesCount ?? 0,
        events_24h: eventsRes.count ?? 0,
        errors_24h: errors24hRes.count ?? 0,
        requests_last_minute: reqLastMinRes.count ?? 0,
        resume_analyses_total: resumeAnalysesRes.count ?? 0,
        interview_messages_total: interviewMsgRes.count ?? 0,
      },
    };
  });