import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

// Rough token estimates per AI call (input + output, blended).
// Tuned conservatively — actual usage varies by model and prompt length.
const TOKENS_PER_CALL: Record<string, number> = {
  resume_ai: 3500,
  interview: 2500,
  assessment_gen: 5000,
};

// Blended USD cost per 1M tokens by model tier (input+output average).
// Defaults assume Gemini 2.5 Flash for most volume.
const COST_PER_M_TOKENS = 0.5; // USD per 1M tokens, blended

function costFor(feature: string, calls: number): number {
  const tokens = (TOKENS_PER_CALL[feature] ?? 2000) * calls;
  return (tokens / 1_000_000) * COST_PER_M_TOKENS;
}

export const getCostMetrics = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().slice(0, 10);

    const [usageRes, usersRes, resumesRes, attemptsRes] = await Promise.all([
      supabase
        .from('ai_usage_daily')
        .select('day, feature, count, user_id')
        .gte('day', startStr)
        .order('day', { ascending: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('resume_analyses').select('id', { count: 'exact', head: true }),
      supabase.from('assessment_attempts').select('id', { count: 'exact', head: true }),
    ]);

    const rows = (usageRes.data ?? []) as Array<{
      day: string;
      feature: string;
      count: number;
      user_id: string;
    }>;

    // Per-day totals
    const byDay = new Map<string, { calls: number; cost: number; users: Set<string> }>();
    const byFeature = new Map<string, { calls: number; cost: number }>();
    let totalCalls = 0;
    let totalCost = 0;
    const activeUsers = new Set<string>();

    for (const r of rows) {
      const c = costFor(r.feature, r.count);
      totalCalls += r.count;
      totalCost += c;
      activeUsers.add(r.user_id);

      const d = byDay.get(r.day) ?? { calls: 0, cost: 0, users: new Set<string>() };
      d.calls += r.count;
      d.cost += c;
      d.users.add(r.user_id);
      byDay.set(r.day, d);

      const f = byFeature.get(r.feature) ?? { calls: 0, cost: 0 };
      f.calls += r.count;
      f.cost += c;
      byFeature.set(r.feature, f);
    }

    const series = Array.from(byDay.entries())
      .map(([day, v]) => ({
        day,
        calls: v.calls,
        cost: Number(v.cost.toFixed(4)),
        active_users: v.users.size,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const featureBreakdown = Array.from(byFeature.entries()).map(([feature, v]) => ({
      feature,
      calls: v.calls,
      cost: Number(v.cost.toFixed(4)),
    }));

    // Last 7 days for trend
    const last7 = series.slice(-7);
    const last7Cost = last7.reduce((a, b) => a + b.cost, 0);
    const last7Calls = last7.reduce((a, b) => a + b.calls, 0);
    const dailyAvgCost = last7.length ? last7Cost / last7.length : 0;

    // Beta projection (500 users x 60 days)
    // Use observed cost-per-active-user-per-day if available, else conservative default.
    const last7ActiveUsers = new Set<string>();
    rows
      .filter((r) => last7.some((d) => d.day === r.day))
      .forEach((r) => last7ActiveUsers.add(r.user_id));

    const observedCostPerUserPerDay =
      last7ActiveUsers.size > 0 ? last7Cost / last7.length / last7ActiveUsers.size : 0.04;

    const beta = {
      target_users: 500,
      duration_days: 60,
      assumed_active_pct: 0.4,
      cost_per_user_per_day: Number(observedCostPerUserPerDay.toFixed(4)),
      projected_ai_cost: Number(
        (500 * 0.4 * 60 * (observedCostPerUserPerDay || 0.04)).toFixed(2),
      ),
    };

    return {
      totals: {
        calls_30d: totalCalls,
        cost_30d: Number(totalCost.toFixed(2)),
        active_users_30d: activeUsers.size,
        cost_7d: Number(last7Cost.toFixed(2)),
        calls_7d: last7Calls,
        daily_avg_cost: Number(dailyAvgCost.toFixed(2)),
        total_users: usersRes.count ?? 0,
        total_resumes: resumesRes.count ?? 0,
        total_attempts: attemptsRes.count ?? 0,
      },
      series,
      feature_breakdown: featureBreakdown,
      beta,
      assumptions: {
        tokens_per_call: TOKENS_PER_CALL,
        usd_per_million_tokens: COST_PER_M_TOKENS,
      },
    };
  });