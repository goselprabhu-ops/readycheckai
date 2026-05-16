import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getFeedbackOverview,
  getRecommendationAccuracy,
  type FeedbackOverview,
  type RecommendationAccuracy,
} from "@/lib/feedback.functions";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles, AlertTriangle } from "lucide-react";

function pct(up: number, total: number) {
  if (!total) return 0;
  return Math.round((up / total) * 100);
}

function surfaceLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FeedbackTab() {
  const fetchOverview = useServerFn(getFeedbackOverview);
  const fetchAccuracy = useServerFn(getRecommendationAccuracy);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<FeedbackOverview | null>(null);
  const [accuracy, setAccuracy] = useState<RecommendationAccuracy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchOverview({ data: { days } }).catch(() => null),
      fetchAccuracy({ data: { days } }).catch(() => null),
    ]).then(([ov, ac]) => {
      if (cancelled) return;
      setOverview(ov);
      setAccuracy(ac);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [days, fetchOverview, fetchAccuracy]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totals = (overview?.by_surface ?? []).reduce(
    (acc, s) => ({ total: acc.total + s.total, up: acc.up + s.up, down: acc.down + s.down }),
    { total: 0, up: 0, down: 0 },
  );

  // Issue prioritization: rank by volume × negativity weight
  const issues = [...(overview?.top_issues ?? [])]
    .map((i) => ({ ...i, score: i.count }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">AI quality & feedback</h2>
          <p className="text-sm text-muted-foreground">
            Real user signal across every AI surface — last {days} days.
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={MessageSquare}
          label="Total feedback"
          value={totals.total.toLocaleString()}
          hint="Signals received in window"
        />
        <MetricCard
          icon={ThumbsUp}
          label="Helpful"
          value={totals.up.toLocaleString()}
          hint={`${pct(totals.up, totals.total)}% of all signal`}
        />
        <MetricCard
          icon={ThumbsDown}
          label="Not helpful"
          value={totals.down.toLocaleString()}
          hint={`${pct(totals.down, totals.total)}% of all signal`}
        />
        <MetricCard
          icon={Sparkles}
          label="Quality score"
          value={`${pct(totals.up, totals.total)}%`}
          hint="Helpful / total"
        />
      </div>

      <SectionCard title="Per-surface breakdown" description="Where AI helps, and where it hurts.">
        {(overview?.by_surface ?? []).length === 0 ? (
          <EmptyState title="No feedback yet" description="Once users start rating, you'll see signal here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Surface</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Helpful</th>
                  <th className="py-2 pr-4">Not helpful</th>
                  <th className="py-2 pr-4">Quality</th>
                  <th className="py-2">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview!.by_surface.map((r) => {
                  const q = pct(r.up, r.total);
                  return (
                    <tr key={r.surface}>
                      <td className="py-2.5 pr-4 font-medium">{surfaceLabel(r.surface)}</td>
                      <td className="py-2.5 pr-4 font-mono">{r.total}</td>
                      <td className="py-2.5 pr-4 font-mono text-emerald-600">{r.up}</td>
                      <td className="py-2.5 pr-4 font-mono text-rose-600">{r.down}</td>
                      <td className="py-2.5 pr-4 font-mono">{q}%</td>
                      <td className="py-2.5">
                        <Badge variant={q >= 75 ? "default" : q >= 50 ? "secondary" : "destructive"}>
                          {q >= 75 ? "Healthy" : q >= 50 ? "Watch" : "At risk"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title="Top issues to prioritize"
          description="Ranked by volume — fix these first."
        >
          {issues.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No issues reported" description="That's a great signal." />
          ) : (
            <ul className="space-y-2">
              {issues.map((i, idx) => (
                <li
                  key={`${i.surface}-${i.issue_tag}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground w-5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.issue_tag.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">{surfaceLabel(i.surface)}</div>
                  </div>
                  <Badge variant="secondary" className="font-mono">{i.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recommendation accuracy"
          description="Acceptance vs. user feedback per source."
        >
          {(accuracy?.by_source ?? []).length === 0 ? (
            <EmptyState title="No recommendations yet" />
          ) : (
            <div className="space-y-2">
              {accuracy!.by_source.map((s) => {
                const acceptRate = pct(s.accepted, s.total);
                const fb = accuracy!.feedback_by_source.find((f) => f.source === s.source);
                const helpfulRate = fb ? pct(fb.feedback_up, fb.feedback_total) : null;
                return (
                  <div key={s.source} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.source}</span>
                      <span className="font-mono text-xs text-muted-foreground">{s.total} recs</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Accepted</div>
                        <div className="font-mono font-semibold">{acceptRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Dismissed</div>
                        <div className="font-mono font-semibold">{pct(s.dismissed, s.total)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Helpful</div>
                        <div className="font-mono font-semibold">
                          {helpfulRate == null ? "—" : `${helpfulRate}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent comments"
        description="Latest user-written feedback across all surfaces."
      >
        {(overview?.recent_comments ?? []).length === 0 ? (
          <EmptyState title="No comments yet" description="Users haven't left detailed feedback." />
        ) : (
          <ul className="space-y-3">
            {overview!.recent_comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={c.rating === 1 ? "default" : "destructive"} className="capitalize">
                    {c.rating === 1 ? "Helpful" : "Issue"}
                  </Badge>
                  <span className="text-muted-foreground">{surfaceLabel(c.surface)}</span>
                  {c.issue_tag ? (
                    <span className="text-muted-foreground">· {c.issue_tag.replace(/_/g, " ")}</span>
                  ) : null}
                  <span className="ml-auto text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}