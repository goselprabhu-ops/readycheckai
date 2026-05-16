import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { PageContainer } from "@/components/layouts/PageContainer";
import {
  getRoleReadiness,
  compareRoles,
} from "@/lib/role-readiness.functions";
import {
  DIMENSION_LABELS,
  READINESS_DIMENSIONS,
  type ReadinessLevel,
} from "@/lib/role-readiness";
import {
  Target,
  Award,
  TrendingUp,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/role-readiness")({
  component: RoleReadinessPage,
});

const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  Beginner: "oklch(0.7 0.18 30)",
  Intermediate: "oklch(0.78 0.16 80)",
  "Interview Ready": "oklch(0.62 0.18 160)",
  Advanced: "oklch(0.55 0.22 260)",
};

const ROLE_COLORS = [
  "hsl(var(--primary))",
  "oklch(0.65 0.2 30)",
  "oklch(0.65 0.18 160)",
  "oklch(0.6 0.2 280)",
];

function RoleReadinessPage() {
  const getReadiness = useServerFn(getRoleReadiness);
  const compare = useServerFn(compareRoles);
  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined);

  const readinessQ = useQuery({
    queryKey: ["role-readiness", activeSlug ?? "default"],
    queryFn: () => getReadiness({ data: { roleSlug: activeSlug } }),
  });

  const compareQ = useQuery({
    queryKey: ["role-compare"],
    queryFn: () => compare({ data: {} }),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Role Readiness"
        description="Recruiter-grade readiness across SQL, Python, Statistics, Visualization, Communication and Business — tuned per analytics role."
        icon={Target}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compare">Role Comparison</TabsTrigger>
          <TabsTrigger value="pathway">Career Pathways</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {readinessQ.isLoading ? (
            <Skeleton className="h-[500px] rounded-xl" />
          ) : !readinessQ.data?.primary ? (
            <EmptyState />
          ) : (
            <OverviewView
              data={readinessQ.data}
              allRoles={compareQ.data?.results ?? []}
              onSelectRole={setActiveSlug}
              activeSlug={readinessQ.data.primary.role.slug}
            />
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-6 mt-6">
          {compareQ.isLoading ? (
            <Skeleton className="h-[600px] rounded-xl" />
          ) : (
            <CompareView results={compareQ.data?.results ?? []} />
          )}
        </TabsContent>

        <TabsContent value="pathway" className="space-y-6 mt-6">
          {compareQ.isLoading ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <PathwayView results={compareQ.data?.results ?? []} />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="font-semibold text-lg">No analytics roles configured</h3>
        <p className="text-sm text-muted-foreground">
          V1 analytics roles couldn't be loaded. Try again shortly.
        </p>
      </CardContent>
    </Card>
  );
}

function OverviewView({
  data,
  allRoles,
  onSelectRole,
  activeSlug,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getRoleReadiness>>>;
  allRoles: Awaited<ReturnType<typeof compareRoles>>["results"];
  onSelectRole: (slug: string) => void;
  activeSlug: string;
}) {
  const { primary, recommendations } = data;
  if (!primary) return null;

  const radarData = primary.dimensions.map((d) => ({
    dimension: d.label,
    You: d.score,
    Benchmark: d.benchmark,
  }));

  return (
    <>
      {/* Role selector chips */}
      <div className="flex flex-wrap gap-2">
        {allRoles.map((r) => (
          <Button
            key={r.role.slug}
            variant={r.role.slug === activeSlug ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectRole(r.role.slug)}
          >
            {r.role.name}
            <Badge variant="secondary" className="ml-2 font-mono">
              {r.overall}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              {primary.role.name}
            </CardTitle>
            <CardDescription>Overall readiness for this role</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Gauge value={primary.overall} level={primary.level} />
            <Badge
              className="mt-4 text-white"
              style={{ backgroundColor: LEVEL_COLOR[primary.level] }}
            >
              {primary.level}
            </Badge>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Skill Radar</CardTitle>
            <CardDescription>Your profile vs. role benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Benchmark"
                  dataKey="Benchmark"
                  stroke="oklch(0.7 0.04 240)"
                  fill="oklch(0.7 0.04 240)"
                  fillOpacity={0.15}
                />
                <Radar
                  name="You"
                  dataKey="You"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.45}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dimension benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Benchmarking</CardTitle>
          <CardDescription>
            Per-skill score vs. interview-ready target for {primary.role.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {primary.dimensions.map((d) => (
            <div key={d.dimension} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  {d.label}
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {(d.weight * 100).toFixed(0)}%
                  </Badge>
                </span>
                <span className="font-mono text-muted-foreground">
                  {d.score} / {d.benchmark}
                </span>
              </div>
              <div className="relative">
                <Progress value={d.score} />
                <div
                  className="absolute top-0 h-2 w-0.5 bg-foreground/60"
                  style={{ left: `${d.benchmark}%` }}
                  aria-label="benchmark marker"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Role-Specific Recommendations
          </CardTitle>
          <CardDescription>
            Prioritized by impact on {primary.role.name} readiness
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You're meeting or exceeding the benchmark across all dimensions.
            </p>
          ) : (
            recommendations.map((r) => (
              <div
                key={r.dimension}
                className="rounded-lg border bg-card/50 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm">{r.title}</h4>
                  <Badge
                    variant={
                      r.priority === "high"
                        ? "default"
                        : r.priority === "medium"
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize text-[10px]"
                  >
                    {r.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CompareView({
  results,
}: {
  results: Awaited<ReturnType<typeof compareRoles>>["results"];
}) {
  const chartData = useMemo(
    () =>
      READINESS_DIMENSIONS.map((d) => {
        const row: any = { dimension: DIMENSION_LABELS[d] };
        results.forEach((r) => {
          const found = r.dimensions.find((x) => x.dimension === d);
          row[r.role.name] = found?.score ?? 0;
        });
        return row;
      }),
    [results],
  );

  if (results.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.map((r, i) => (
          <Card key={r.role.slug}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{r.role.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span
                  className="font-display text-3xl font-bold"
                  style={{ color: ROLE_COLORS[i % ROLE_COLORS.length] }}
                >
                  {r.overall}
                </span>
                <Badge
                  className="text-white"
                  style={{ backgroundColor: LEVEL_COLOR[r.level] }}
                >
                  {r.level}
                </Badge>
              </div>
              <Progress value={r.overall} />
              <p className="text-xs text-muted-foreground">
                Top skill:{" "}
                <span className="font-medium text-foreground">
                  {
                    [...r.dimensions].sort((a, b) => b.score - a.score)[0]
                      ?.label
                  }
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Biggest gap:{" "}
                <span className="font-medium text-foreground">
                  {
                    [...r.dimensions].sort(
                      (a, b) => b.gap * b.weight - a.gap * a.weight,
                    )[0]?.label
                  }
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cross-Role Skill Benchmarks
          </CardTitle>
          <CardDescription>
            Same scores, weighted differently by role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend />
              {results.map((r, i) => (
                <Bar
                  key={r.role.slug}
                  dataKey={r.role.name}
                  fill={ROLE_COLORS[i % ROLE_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function PathwayView({
  results,
}: {
  results: Awaited<ReturnType<typeof compareRoles>>["results"];
}) {
  if (results.length === 0) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {results.map((r) => (
        <Card key={r.role.slug}>
          <CardHeader>
            <CardTitle>{r.role.name}</CardTitle>
            <CardDescription>
              Typical career trajectory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {r.pathway.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pathway configured.
                </p>
              ) : (
                r.pathway.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 rounded-md border bg-card/50 px-3 py-2 text-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium">{step}</span>
                    {idx < r.pathway.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </li>
                ))
              )}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Gauge({ value, level }: { value: number; level: ReadinessLevel }) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = LEVEL_COLOR[level];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="none"
          opacity={0.3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}