import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { DollarSign, Activity, Users, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCostMetrics } from '@/lib/cost-tracking.functions';
import { toast } from 'sonner';

type Metrics = Awaited<ReturnType<typeof getCostMetrics>>;

export function CostTrackingTab() {
  const fetchMetrics = useServerFn(getCostMetrics);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setData(await fetchMetrics());
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to load cost metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!data) {
    return <p className="text-sm text-muted-foreground p-4">Loading cost metrics…</p>;
  }

  const { totals, series, feature_breakdown, beta, assumptions } = data;
  const maxCost = Math.max(...series.map((s) => s.cost), 0.0001);

  const cards = [
    { label: 'Cost (30d)', value: `$${totals.cost_30d}`, icon: DollarSign },
    { label: 'Cost (7d)', value: `$${totals.cost_7d}`, icon: TrendingUp },
    { label: 'AI calls (30d)', value: totals.calls_30d.toLocaleString(), icon: Activity },
    { label: 'Active AI users (30d)', value: totals.active_users_30d, icon: Users },
  ];

  const burnRateMonthly = totals.daily_avg_cost * 30;
  const overBudget = burnRateMonthly > 200;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Cost Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Live token usage and projected beta spend. Estimates use ${assumptions.usd_per_million_tokens}/1M tokens (Gemini 2.5 Flash blended).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {overBudget && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Monthly burn rate above $200</AlertTitle>
          <AlertDescription>
            Projected monthly cost at current pace: <strong>${burnRateMonthly.toFixed(2)}</strong>.
            Tighten daily caps in <code>src/lib/ai-guardrails.ts</code> or switch heavier features to cheaper models.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beta projection (500 users × 60 days)</CardTitle>
          <CardDescription>
            Assumes {Math.round(beta.assumed_active_pct * 100)}% of signups are active daily.
            Based on observed cost-per-active-user-per-day: <strong>${beta.cost_per_user_per_day}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Projected AI cost</div>
              <div className="text-2xl font-bold text-primary">${beta.projected_ai_cost}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Target users</div>
              <div className="text-2xl font-bold">{beta.target_users}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="text-2xl font-bold">{beta.duration_days}d</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">$/user/day</div>
              <div className="text-2xl font-bold">${beta.cost_per_user_per_day}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily cost (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground">No AI usage recorded yet.</p>
          ) : (
            <div className="space-y-1">
              {series.slice(-14).map((s) => (
                <div key={s.day} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-muted-foreground w-20 shrink-0">{s.day}</span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${(s.cost / maxCost) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono w-16 text-right">${s.cost.toFixed(3)}</span>
                  <span className="text-muted-foreground w-20 text-right">
                    {s.calls} calls · {s.active_users}u
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown by feature</CardTitle>
        </CardHeader>
        <CardContent>
          {feature_breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {feature_breakdown
                .sort((a, b) => b.cost - a.cost)
                .map((f) => (
                  <div key={f.feature} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{f.feature}</Badge>
                      <span className="text-muted-foreground text-xs">
                        ~{assumptions.tokens_per_call[f.feature] ?? 2000} tok/call
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{f.calls.toLocaleString()} calls</span>
                      <span className="font-mono font-medium w-20 text-right">${f.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}