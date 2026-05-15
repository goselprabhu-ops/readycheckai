import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FileText,
  Target,
  TrendingUp,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ScorePill } from "@/components/common/ScorePill";
import { ReadinessAreaChart, AttemptsBarChart } from "@/components/dashboard-charts";
import { ANALYTICS_ROLE_LIST, ANALYTICS_ROLE_CONFIG } from "@/shared/config/roles";
import type { AnalyticsRole } from "@/shared/types/roles";
import { getRoleAnalytics } from "@/lib/role-analytics.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsDashboard,
});

function AnalyticsDashboard() {
  const [role, setRole] = useState<AnalyticsRole>("data_analyst");
  const config = ANALYTICS_ROLE_CONFIG[role];
  const RoleIcon = config.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Version 1 · Analytics careers"
        title="Role readiness analytics"
        description="Track your fit against analytics roles using your resume, assessments, and skill signals — all from real activity."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <TrendingUp className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        }
      />

      <Tabs value={role} onValueChange={(v) => setRole(v as AnalyticsRole)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {ANALYTICS_ROLE_LIST.map((r) => {
            const Icon = r.icon;
            return (
              <TabsTrigger
                key={r.id}
                value={r.id}
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{r.label}</span>
                <span className="sm:hidden">{r.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ANALYTICS_ROLE_LIST.map((r) => (
          <TabsContent key={r.id} value={r.id} className="mt-6 space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <RoleIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold">{config.label}</h2>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <RolePanel role={r.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function RolePanel({ role }: { role: AnalyticsRole }) {
  const fetchAnalytics = useServerFn(getRoleAnalytics);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["role-analytics", role],
    queryFn: () => fetchAnalytics({ data: { role } }),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Couldn't load analytics"
        description="Something went wrong fetching your role data."
        action={<Button size="sm" onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const matchValue = data.match ?? 0;
  const matchHint = data.match === null
    ? "Upload a resume to compute fit"
    : matchLabel(matchValue);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Role match"
          value={data.match === null ? "—" : `${matchValue}%`}
          icon={Target}
          hint={matchHint}
        />
        <MetricCard
          label="Resume ATS"
          value={`${data.ats}%`}
          icon={FileText}
          hint={data.resumeAt ? `Updated ${formatDate(data.resumeAt)}` : "No resume yet"}
        />
        <MetricCard
          label="Readiness"
          value={`${data.readiness}%`}
          icon={BarChart3}
          hint={data.readinessLevel}
        />
        <MetricCard
          label="Assessments"
          value={data.attemptsCount}
          icon={ClipboardList}
          hint={data.attemptsCount ? `Avg ${data.avgAttemptScore}% · Best ${data.bestAttemptScore}%` : "Take a role test"}
        />
      </div>

      {/* Trend + Recent attempts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Readiness trend"
          description="Composite, resume and skills over time"
        >
          {data.trend.length === 0 ? (
            <EmptyState
              title="No history yet"
              description="Recompute readiness from the dashboard to start tracking progress."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/dashboard"><Sparkles className="mr-2 h-4 w-4" />Recompute</Link>
                </Button>
              }
            />
          ) : (
            <ReadinessAreaChart
              data={data.trend.map((t) => ({
                date: t.date,
                Readiness: t.readiness,
                Resume: t.resume,
                Skills: t.skills,
              }))}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Recent attempts"
          description={`Filtered to ${ANALYTICS_ROLE_CONFIG[role].label} topics`}
        >
          {data.attempts.length === 0 ? (
            <EmptyState
              title="No attempts yet"
              description="Take a role-relevant assessment to see scores here."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/assessment"><ClipboardList className="mr-2 h-4 w-4" />Start</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.topic}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(a.created_at)}</div>
                  </div>
                  <ScorePill value={a.score} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Skill gap + Recommendations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Skill gap matrix"
          description="Core skills for this role vs. what we detected from your resume and assessments"
        >
          <ul className="space-y-3">
            {data.skillGap.map((s) => (
              <li key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {s.have ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    {s.name}
                  </span>
                  <Badge variant={s.have ? "default" : "secondary"} className="font-mono text-xs">
                    {s.level}
                  </Badge>
                </div>
                <Progress value={s.level} className="h-1.5" />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Recommendations"
          description="Highest-priority next steps"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/roadmap">View all</Link>
            </Button>
          }
        >
          {data.recommendations.length === 0 ? (
            <EmptyState
              title="No recommendations"
              description="They appear after your first readiness recompute."
            />
          ) : (
            <ul className="space-y-3">
              {data.recommendations.map((r) => (
                <li key={r.id} className="rounded-md border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{r.title}</h4>
                    <Badge variant="outline" className="font-mono text-[10px]">P{r.priority}</Badge>
                  </div>
                  {r.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Match progress strip */}
      <SectionCard
        title="Where you stand for this role"
        description="Combined fit signal blending resume match and readiness"
      >
        <div className="space-y-4">
          <Bar label="Role match (resume)" value={data.match ?? 0} mute={data.match === null} />
          <Bar label="Overall readiness" value={data.readiness} />
          <Bar label="Resume ATS" value={data.ats} />
        </div>
      </SectionCard>
    </div>
  );
}

function Bar({ label, value, mute }: { label: string; value: number; mute?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted-foreground">{mute ? "—" : `${value}%`}</span>
      </div>
      <Progress value={mute ? 0 : value} className="h-2" />
    </div>
  );
}

function matchLabel(v: number) {
  if (v >= 80) return "Strong fit";
  if (v >= 60) return "Promising";
  if (v >= 40) return "Developing";
  return "Early stage";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}