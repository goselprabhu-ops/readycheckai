import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPlatformMonitoring } from "@/lib/monitoring.functions";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  MessageSquare,
  Database,
  CreditCard,
  RefreshCw,
  Activity,
  AlertTriangle,
  Server,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type Snapshot = Awaited<ReturnType<typeof getPlatformMonitoring>>;

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function MonitoringTab() {
  const fetchSnapshot = useServerFn(getPlatformMonitoring);
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const snap = await fetchSnapshot();
      setData(snap);
    } catch (e) {
      toast.error("Failed to load monitoring snapshot", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(true), 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { ai, otp, subscriptions, hosting } = data;
  const dbHealthy = hosting.db_ok && hosting.db_latency_ms < 500;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          <span>
            Snapshot taken{" "}
            <span className="tabular-nums">
              {new Date(data.checked_at).toLocaleTimeString()}
            </span>{" "}
            · auto-refresh every 60s
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Top-level cost drivers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="AI calls · today"
          value={fmt(ai.today_total)}
          icon={Brain}
          hint={`${fmt(ai.month_total)} in last 30d`}
        />
        <MetricCard
          label="OTPs sent · 24h"
          value={fmt(otp.sent_24h)}
          icon={MessageSquare}
          hint={`${fmt(otp.sent_30d)} in 30d · ${otp.provider}`}
        />
        <MetricCard
          label="Active subscriptions"
          value={fmt(subscriptions.active_live)}
          icon={CreditCard}
          hint={`+${subscriptions.new_subs_30d} new in 30d`}
        />
        <MetricCard
          label="DB latency"
          value={`${hosting.db_latency_ms}ms`}
          icon={Database}
          hint={dbHealthy ? "Healthy" : "Degraded"}
        />
      </div>

      {/* AI subscription */}
      <SectionCard
        title="AI Gateway"
        description="Lovable AI usage and cache savings across all features."
        action={
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {ai.cache_hit_rate}% cached
          </Badge>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Calls today" value={fmt(ai.today_total)} />
          <Stat label="Calls · 30d" value={fmt(ai.month_total)} />
          <Stat
            label="Cache hits · 30d"
            value={fmt(ai.cache_hits)}
            sub={`${fmt(ai.cache_entries)} entries`}
          />
        </div>
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Calls by feature · 30d
          </p>
          <FeatureBars data={ai.month_by_feature} />
        </div>
      </SectionCard>

      {/* OTP subscription */}
      <SectionCard
        title="Phone OTP delivery"
        description="SMS provider spend driver. Each send is a billable message."
        action={<Badge variant="outline">{otp.provider}</Badge>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Sent · 24h" value={fmt(otp.sent_24h)} />
          <Stat label="Sent · 30d" value={fmt(otp.sent_30d)} />
          <Stat
            label="Daily average"
            value={fmt(Math.round(otp.sent_30d / 30))}
            sub="last 30 days"
          />
        </div>
      </SectionCard>

      {/* Hosting + DB */}
      <SectionCard
        title="Hosting & Database"
        description="Lovable Cloud load — request volume, error rate, table size."
        action={
          <Badge
            variant={dbHealthy ? "secondary" : "destructive"}
            className="gap-1"
          >
            <Server className="h-3 w-3" />
            {dbHealthy ? "Healthy" : "Degraded"}
          </Badge>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Requests · last 1m"
            value={fmt(hosting.requests_last_minute)}
            sub={`${fmt(hosting.events_24h)} in 24h`}
          />
          <Stat
            label="Errors · 24h"
            value={fmt(hosting.errors_24h)}
            sub={hosting.errors_24h > 0 ? "review security log" : "all clear"}
            tone={hosting.errors_24h > 0 ? "warn" : "ok"}
          />
          <Stat
            label="Total users"
            value={fmt(hosting.profiles_count)}
            sub="profiles row count"
          />
          <Stat
            label="AI artifacts"
            value={fmt(
              hosting.resume_analyses_total + hosting.interview_messages_total,
            )}
            sub={`${fmt(hosting.resume_analyses_total)} resumes · ${fmt(hosting.interview_messages_total)} interview msgs`}
          />
        </div>
      </SectionCard>

      {/* Subscriptions */}
      <SectionCard
        title="Paid subscriptions"
        description="Live revenue drivers. Sandbox rows excluded from live totals."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Active · live"
            value={fmt(subscriptions.active_live)}
            sub={`+${subscriptions.new_subs_30d} new in 30d`}
          />
          <Stat
            label="Active · sandbox"
            value={fmt(subscriptions.active_sandbox)}
            sub="test mode"
          />
          <Stat
            label="Distinct plans"
            value={fmt(Object.keys(subscriptions.by_plan).length)}
            sub="currently subscribed"
          />
        </div>
        {Object.keys(subscriptions.by_plan).length > 0 ? (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active subscriptions by plan
            </p>
            <FeatureBars data={subscriptions.by_plan} />
          </div>
        ) : null}
      </SectionCard>

      {hosting.errors_24h > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="font-medium text-foreground">
              {hosting.errors_24h} error events in the last 24 hours
            </p>
            <p className="text-muted-foreground">
              Review the Audit tab or system events for details.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`font-display text-2xl font-semibold tracking-tight tabular-nums ${
          tone === "warn" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function FeatureBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{key}</span>
            <span className="text-muted-foreground tabular-nums">{fmt(value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}