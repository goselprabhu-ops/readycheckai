import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layouts/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { getMarketIntelligence } from "@/lib/market.functions";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Briefcase,
  IndianRupee,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/market")({
  component: MarketIntelligencePage,
});

const SKILL_COLORS = [
  "hsl(var(--primary))",
  "oklch(0.65 0.2 30)",
  "oklch(0.62 0.18 160)",
  "oklch(0.6 0.2 280)",
  "oklch(0.7 0.18 60)",
  "oklch(0.65 0.18 200)",
  "oklch(0.6 0.18 340)",
  "oklch(0.7 0.15 100)",
];

function MarketIntelligencePage() {
  const fetchMarket = useServerFn(getMarketIntelligence);
  const { data, isLoading } = useQuery({
    queryKey: ["market-intelligence"],
    queryFn: () => fetchMarket(),
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Market Intelligence"
        title={
          <span className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Analytics Hiring Market
          </span>
        }
        description="Trending skills, hiring demand, salary insights, and industry growth — refreshed monthly."
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Tracked Skills"
              value={data.skills.length}
              icon={Activity}
              accent="text-primary"
            />
            <KpiCard
              label="Active Roles"
              value={data.roles.length}
              icon={Briefcase}
              accent="text-emerald-500"
            />
            <KpiCard
              label="Hottest Skill"
              value={data.skills[0]?.skill ?? "—"}
              sub={`${data.skills[0]?.latestIndex ?? 0} demand`}
              icon={Flame}
              accent="text-orange-500"
            />
            <KpiCard
              label="Top Industry"
              value={data.industries[0]?.industry ?? "—"}
              sub={`${data.industries[0]?.hiring_index ?? 0} index`}
              icon={TrendingUp}
              accent="text-purple-500"
            />
          </div>

          <Tabs defaultValue="skills" className="mt-6">
            <TabsList>
              <TabsTrigger value="skills">Trending Skills</TabsTrigger>
              <TabsTrigger value="demand">Hiring Demand</TabsTrigger>
              <TabsTrigger value="salary">Salary Insights</TabsTrigger>
              <TabsTrigger value="industry">Industry Growth</TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="space-y-6 mt-6">
              <SkillsView skills={data.skills} />
            </TabsContent>

            <TabsContent value="demand" className="space-y-6 mt-6">
              <DemandView roles={data.roles} />
            </TabsContent>

            <TabsContent value="salary" className="space-y-6 mt-6">
              <SalaryView salaries={data.salaries} />
            </TabsContent>

            <TabsContent value="industry" className="space-y-6 mt-6">
              <IndustryView industries={data.industries} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageContainer>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="font-display text-2xl font-semibold mt-1">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
          <Icon className={cn("h-5 w-5", accent ?? "text-muted-foreground")} />
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <Badge
      variant={up ? "default" : "destructive"}
      className={cn(
        "font-mono gap-1",
        up
          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
          : "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15",
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </Badge>
  );
}

function SkillsView({
  skills,
}: {
  skills: Awaited<ReturnType<typeof getMarketIntelligence>>["skills"];
}) {
  const combinedSeries = useMemo(() => {
    const monthsSet = new Set<string>();
    skills.forEach((s) => s.series.forEach((p) => monthsSet.add(p.month)));
    const months = [...monthsSet].sort();
    return months.map((m) => {
      const row: any = { month: m.slice(0, 7) };
      skills.slice(0, 5).forEach((s) => {
        row[s.skill] = s.series.find((p) => p.month === m)?.demand_index ?? null;
      });
      return row;
    });
  }, [skills]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Skill Demand — last 12 months</CardTitle>
          <CardDescription>
            Indexed 0–100 (100 = peak posting volume)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={combinedSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend />
              {skills.slice(0, 5).map((s, i) => (
                <Line
                  key={s.skill}
                  type="monotone"
                  dataKey={s.skill}
                  stroke={SKILL_COLORS[i % SKILL_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {skills.map((s) => (
          <Card key={s.skill}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {s.category}
                  </p>
                  <h3 className="font-semibold text-lg">{s.skill}</h3>
                </div>
                <GrowthBadge value={s.avgGrowth} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold">
                  {s.latestIndex}
                </span>
                <span className="text-xs text-muted-foreground">
                  demand index
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                ~{(s.totalPostings / 1000).toFixed(1)}k postings (12mo)
              </p>
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={s.series}>
                  <Area
                    type="monotone"
                    dataKey="demand_index"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function DemandView({
  roles,
}: {
  roles: Awaited<ReturnType<typeof getMarketIntelligence>>["roles"];
}) {
  // Heatmap: roles x months
  const months = useMemo(() => {
    if (roles.length === 0) return [] as string[];
    return roles[0].series.map((p) => p.month.slice(5, 7));
  }, [roles]);

  const heatColor = (v: number) => {
    // 30..100 -> light to deep primary
    const t = Math.max(0, Math.min(1, (v - 30) / 70));
    return `color-mix(in oklab, hsl(var(--primary)) ${Math.round(15 + t * 75)}%, transparent)`;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <Card key={r.role_slug}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{r.role_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl font-bold">
                  {r.latestOpenings.toLocaleString()}
                </span>
                <GrowthBadge value={r.avgGrowth} />
              </div>
              <p className="text-xs text-muted-foreground">
                Active openings · index {r.latestIndex}
              </p>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={r.series}>
                  <Area
                    type="monotone"
                    dataKey="openings"
                    stroke="oklch(0.62 0.18 160)"
                    fill="oklch(0.62 0.18 160)"
                    fillOpacity={0.25}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hiring Heatmap</CardTitle>
          <CardDescription>
            Monthly demand index per role (deeper = hotter)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Role
                  </th>
                  {months.map((m, i) => (
                    <th
                      key={i}
                      className="p-2 font-mono text-muted-foreground text-center"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.role_slug}>
                    <td className="p-2 font-medium whitespace-nowrap">
                      {r.role_name}
                    </td>
                    {r.series.map((p, i) => (
                      <td key={i} className="p-1">
                        <div
                          title={`${p.month}: ${p.demand_index}`}
                          className="h-8 rounded flex items-center justify-center font-mono text-[10px] text-foreground/80"
                          style={{ background: heatColor(p.demand_index) }}
                        >
                          {p.demand_index}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function SalaryView({
  salaries,
}: {
  salaries: Awaited<ReturnType<typeof getMarketIntelligence>>["salaries"];
}) {
  const fmtINR = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${(n / 1000).toFixed(0)}k`;
  };

  // Group by role
  const grouped = useMemo(() => {
    const m = new Map<string, typeof salaries>();
    for (const s of salaries) {
      if (!m.has(s.role_slug)) m.set(s.role_slug, [] as any);
      m.get(s.role_slug)!.push(s);
    }
    return [...m.entries()];
  }, [salaries]);

  const chartData = useMemo(
    () =>
      grouped.map(([slug, bands]) => {
        const row: any = { role: bands[0].role_name };
        for (const b of bands) row[b.experience_level] = b.salary_median;
        return row;
      }),
    [grouped],
  );

  const levels = Array.from(
    new Set(salaries.map((s) => s.experience_level)),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Median Salary by Role & Experience (India)
          </CardTitle>
          <CardDescription>Annual CTC, in INR</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="role" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip
                formatter={(v: any) => fmtINR(Number(v))}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend />
              {levels.map((lvl, i) => (
                <Bar
                  key={lvl}
                  dataKey={lvl}
                  fill={SKILL_COLORS[i % SKILL_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {grouped.map(([slug, bands]) => (
          <Card key={slug}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{bands[0].role_name}</CardTitle>
              <CardDescription>India · INR per annum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bands.map((b) => (
                <div key={b.experience_level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {b.experience_level}
                    </span>
                    <span className="font-mono">
                      {fmtINR(b.salary_median)}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute h-full bg-primary/30"
                      style={{
                        left: `${(b.salary_min / b.salary_max) * 100}%`,
                        width: `${
                          100 - (b.salary_min / b.salary_max) * 100
                        }%`,
                      }}
                    />
                    <div
                      className="absolute h-full w-1 bg-primary"
                      style={{
                        left: `${(b.salary_median / b.salary_max) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{fmtINR(b.salary_min)}</span>
                    <span>{fmtINR(b.salary_max)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function IndustryView({
  industries,
}: {
  industries: Awaited<ReturnType<typeof getMarketIntelligence>>["industries"];
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Industry Hiring Index</CardTitle>
          <CardDescription>
            Where analytics talent is being absorbed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={industries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="industry"
                tick={{ fontSize: 12 }}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="hiring_index"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {industries.map((i) => (
          <Card key={i.industry}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{i.industry}</h3>
                <GrowthBadge value={Number(i.growth_pct)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold">
                  {i.hiring_index}
                </span>
                <span className="text-xs text-muted-foreground">
                  hiring index
                </span>
              </div>
              {i.top_skill && (
                <p className="text-xs text-muted-foreground">
                  Most in-demand skill:{" "}
                  <Badge variant="secondary" className="ml-1">
                    {i.top_skill}
                  </Badge>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}