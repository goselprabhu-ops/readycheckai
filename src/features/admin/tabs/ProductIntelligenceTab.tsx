import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProductIntelligence, type ProductIntelligence } from "@/lib/product-intelligence.functions";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";
import {
  Users, Activity, Sparkles, TrendingDown, MousePointerClick, Brain, FileText, CreditCard,
} from "lucide-react";

const STAGES = [
  { key: "signups", label: "Signed up", icon: Users },
  { key: "onboarded", label: "Onboarded", icon: Sparkles },
  { key: "resumed", label: "Uploaded resume", icon: FileText },
  { key: "assessed", label: "Took assessment", icon: Brain },
  { key: "interviewed", label: "Did interview", icon: Activity },
  { key: "upgraded", label: "Upgraded", icon: CreditCard },
] as const;

export function ProductIntelligenceTab() {
  const fn = useServerFn(getProductIntelligence);
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<ProductIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (d: number) => {
    setLoading(true);
    fn({ data: { days: d } })
      .then((r) => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(days); /* eslint-disable-next-line */ }, [days]);

  const funnelRows = useMemo(() => {
    if (!data) return [];
    const base = (data.funnel as any)?.signups || 1;
    return STAGES.map((s) => {
      const value = (data.funnel as any)[s.key] ?? 0;
      const pct = Math.round((value / Math.max(base, 1)) * 100);
      return { ...s, value, pct };
    });
  }, [data]);

  const cohortRows = useMemo(() => {
    if (!data) return [];
    return data.cohorts.map((c) => ({
      week: new Date(c.cohort_week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      D1: c.users ? Math.round((c.d1_count / c.users) * 100) : 0,
      D7: c.users ? Math.round((c.d7_count / c.users) * 100) : 0,
      D30: c.users ? Math.round((c.d30_count / c.users) * 100) : 0,
      users: c.users,
    }));
  }, [data]);

  if (loading && !data) return <div className="text-sm text-muted-foreground">Loading product intelligence…</div>;
  if (!data) return <EmptyState title="No analytics yet" description="Once users start interacting, intelligence will appear here." />;

  const eng = data.engagement;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          Updated {new Date(data.computed_at).toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="DAU" value={eng.dau} icon={Users} />
        <MetricCard label="WAU" value={eng.wau} icon={Users} />
        <MetricCard label="MAU" value={eng.mau} icon={Users} />
        <MetricCard label="Events 24h" value={eng.events_24h} icon={Activity} />
        <MetricCard label="Sessions 24h" value={eng.sessions_24h} icon={MousePointerClick} />
        <MetricCard label={`Events ${days}d`} value={eng.events_window} icon={Activity} />
      </div>

      <SectionCard title="Acquisition funnel" description={`Cohort: users created in the last ${days} days`}>
        <div className="space-y-2">
          {funnelRows.map((r, i) => {
            const prev = i > 0 ? funnelRows[i - 1].value : r.value;
            const stepDrop = prev > 0 ? Math.round(((prev - r.value) / prev) * 100) : 0;
            return (
              <div key={r.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <r.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{r.label}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="font-semibold">{r.value}</span>
                    <Badge variant="secondary">{r.pct}%</Badge>
                    {i > 0 && stepDrop > 0 && (
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        <TrendingDown className="h-3 w-3 mr-1" /> -{stepDrop}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Daily active users" description={`Last ${days} days`}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.daily_active}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="dau" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Weekly cohort retention" description="% of each signup week active at D1 / D7 / D30">
          {cohortRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No cohort data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cohortRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="D1" fill="hsl(var(--chart-1))" />
                <Bar dataKey="D7" fill="hsl(var(--chart-2))" />
                <Bar dataKey="D30" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Feature heatmap" description="Top events by volume">
          <div className="space-y-1.5 max-h-96 overflow-auto pr-1">
            {data.feature_heatmap.map((f) => {
              const max = data.feature_heatmap[0]?.total || 1;
              const w = Math.max(4, Math.round((f.total / max) * 100));
              return (
                <div key={f.event_name} className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{f.event_name}</div>
                    <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                  <div className="tabular-nums text-muted-foreground whitespace-nowrap">
                    {f.total} · <span className="text-foreground">{f.unique_users}u</span>
                  </div>
                </div>
              );
            })}
            {data.feature_heatmap.length === 0 && (
              <div className="text-sm text-muted-foreground">No events tracked yet.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top pages" description="Most visited routes">
          <div className="space-y-1.5 max-h-96 overflow-auto pr-1">
            {data.top_routes.map((r) => (
              <div key={r.route} className="flex items-center justify-between text-xs">
                <span className="truncate font-mono">{r.route}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.views} · <span className="text-foreground">{r.users}u</span>
                </span>
              </div>
            ))}
            {data.top_routes.length === 0 && (
              <div className="text-sm text-muted-foreground">No page view events yet.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Drop-off pages" description="Pages where sessions ended">
        {data.dropoff_pages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No exit data yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.dropoff_pages.map((p) => (
              <div key={p.route} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-xs">
                <span className="font-mono truncate">{p.route}</span>
                <Badge variant="outline">{p.exits} exits</Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
