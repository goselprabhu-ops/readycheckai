import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GraduationCap,
  LineChart as LineChartIcon,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";

import {
  demoCandidates,
  demoCohortReadiness,
  demoFeatureUsage,
  demoFunnel,
  demoInstitution,
  demoInterviewReport,
  demoReadinessTrend,
  demoResumeReport,
  demoSkillRadar,
} from "@/features/demo/data";
import {
  CandidateRow,
  DemoStat,
  LevelBadge,
  ReadinessRing,
  SkillBar,
} from "@/features/demo/DemoComponents";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Recruiter Demo — ReadyCheck Lab" },
      {
        name: "description",
        content:
          "Experience ReadyCheck Lab without signing up. Explore demo candidate profiles, readiness dashboards, interview reports, resume intelligence, and the institution analytics view.",
      },
      { property: "og:title", content: "Recruiter Demo — ReadyCheck Lab" },
      {
        property: "og:description",
        content:
          "A live, no-signup tour of ReadyCheck Lab for recruiters and institutions — candidate readiness, interview & resume reports, and cohort analytics.",
      },
      { property: "og:url", content: "https://readycheckai.lovable.app/demo" },
    ],
    links: [{ rel: "canonical", href: "https://readycheckai.lovable.app/demo" }],
  }),
});

function DemoBanner() {
  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary ring-1 ring-inset ring-primary/20">
            <Sparkles className="h-3 w-3" /> Demo Mode
          </span>
          <p className="text-sm text-foreground/80">
            You are exploring sample candidates and analytics. No signup required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/contact">
            <Button variant="outline" size="sm">
              Book a call
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="gap-1.5">
              Start a real workspace <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DemoPage() {
  const [activeId, setActiveId] = useState(demoCandidates[0].id);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demoCandidates;
    return demoCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.targetRole.toLowerCase().includes(q) ||
        c.topSkills.some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);
  const active = demoCandidates.find((c) => c.id === activeId) ?? demoCandidates[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="light" />
      <DemoBanner />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Recruiter & Institution Demo"
          title="See what hiring-ready candidates look like."
          description="Explore a curated sample of profiles, readiness analytics, interview reports, and resume intelligence — exactly as you would in a real ReadyCheck Lab workspace."
          actions={
            <>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" /> Download sample pack
              </Button>
              <Link to="/signup">
                <Button size="sm" className="gap-1.5">
                  Get full access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DemoStat label="Candidates in demo" value={demoCandidates.length} hint="Curated across 4 target roles" />
          <DemoStat label="Avg readiness" value="74" hint="Cohort-level composite" accent="primary" />
          <DemoStat
            label="Placement-ready"
            value={`${demoCohortReadiness[0].value}%`}
            hint="Above 75 composite score"
            accent="success"
          />
          <DemoStat label="Interview band" value="A / A−" hint="Across 6 sample interviews" />
        </div>

        <Tabs defaultValue="candidates" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto md:flex-wrap gap-1 bg-muted/40 p-1 justify-start no-scrollbar">
            <TabsTrigger value="candidates" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Candidates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <LineChartIcon className="h-3.5 w-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Interview Report
            </TabsTrigger>
            <TabsTrigger value="resume" className="gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Resume Intelligence
            </TabsTrigger>
            <TabsTrigger value="institution" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Institution
            </TabsTrigger>
          </TabsList>

          {/* CANDIDATES + READINESS DASHBOARD */}
          <TabsContent value="candidates" className="space-y-6 focus-visible:outline-none">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter by name, role or skill…"
                    className="pl-9"
                  />
                </div>
                <div className="space-y-2">
                  {filtered.map((c) => (
                    <CandidateRow
                      key={c.id}
                      c={c}
                      active={c.id === active.id}
                      onClick={() => setActiveId(c.id)}
                    />
                  ))}
                  {filtered.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                      No candidates match that filter.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6">
                <SectionCard
                  title={
                    <span className="flex items-center gap-2">
                      {active.name}
                      <LevelBadge level={active.level} />
                    </span>
                  }
                  description={`${active.headline} · ${active.college} · ${active.location}`}
                  action={
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Shortlist</Button>
                      <Button size="sm" className="gap-1.5">
                        Request interview <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  }
                >
                  <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-4">
                      <ReadinessRing value={active.readiness} size={96} />
                      <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        Composite readiness
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <SkillBar label="SQL" value={active.sql} />
                      <SkillBar label="Python" value={active.python} />
                      <SkillBar label="Resume" value={active.resume} />
                      <SkillBar label="Interview" value={active.interview} />
                    </div>
                  </div>

                  <Separator className="my-5" />

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Top skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {active.topSkills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                      <p className="pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Standout signal
                      </p>
                      <p className="text-sm text-foreground/90">{active.highlight}</p>
                    </div>
                    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> Interview
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {active.interviewSummary}
                      </p>
                      <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Resume
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{active.resumeSummary}</p>
                    </div>
                  </div>
                </SectionCard>

                <div className="grid gap-6 md:grid-cols-2">
                  <SectionCard title="Skill radar" description="Composite competencies across the demo cohort.">
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={demoSkillRadar} outerRadius="78%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                          <Radar
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.25}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>

                  <SectionCard title="Readiness trajectory" description="8-week trend, cohort vs. top quartile.">
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={demoReadinessTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={[40, 100]} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="cohort" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Cohort avg" />
                          <Line type="monotone" dataKey="top" stroke="oklch(0.72 0.16 160)" strokeWidth={2} dot={false} name="Top quartile" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="space-y-6 focus-visible:outline-none">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DemoStat label="Sourced" value="1,240" hint="Last 30 days" />
              <DemoStat label="Assessed" value="318" hint="Completed full battery" accent="primary" />
              <DemoStat label="Interview rate" value="30%" hint="Of assessment-cleared" accent="success" />
              <DemoStat label="Time to offer" value="11 days" hint="Median across pipeline" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Hiring funnel" description="From sourced to offer for the demo cohort.">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demoFunnel} layout="vertical" margin={{ left: 12, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="stage" type="category" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Readiness distribution" description="Where the cohort sits on the readiness curve.">
                <div className="space-y-3">
                  {demoCohortReadiness.map((b) => (
                    <div key={b.bucket} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{b.bucket}</span>
                        <span className="tabular-nums text-muted-foreground">{b.value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${b.value * 2.2}%`, background: b.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-5" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Feature engagement (last 30 days)
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {demoFeatureUsage.map((f) => (
                    <div key={f.feature} className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2">
                      <f.icon className="h-3.5 w-3.5 text-primary" />
                      <span className="flex-1 truncate text-xs">{f.feature}</span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {f.users.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* INTERVIEW REPORT */}
          <TabsContent value="interview" className="space-y-6 focus-visible:outline-none">
            <SectionCard
              title={`${demoInterviewReport.candidate} — ${demoInterviewReport.role}`}
              description={`AI-scored interview · ${demoInterviewReport.durationMin} min · Sample report`}
              action={
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" /> Overall {demoInterviewReport.overall}
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              }
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  {demoInterviewReport.competencies.map((c) => (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="font-semibold tabular-nums text-foreground">{c.score}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{c.note}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                      {demoInterviewReport.strengths.map((s) => (
                        <li key={s} className="flex gap-2"><span className="text-emerald-600">•</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">
                      <TrendingUp className="h-3.5 w-3.5" /> Areas to develop
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                      {demoInterviewReport.improvements.map((s) => (
                        <li key={s} className="flex gap-2"><span className="text-amber-600">•</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                      Hiring recommendation
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                      {demoInterviewReport.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* RESUME INTELLIGENCE */}
          <TabsContent value="resume" className="space-y-6 focus-visible:outline-none">
            <SectionCard
              title={`${demoResumeReport.candidate} — ${demoResumeReport.role}`}
              description="AI resume intelligence · Sample report"
              action={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DemoStat label="JD match" value={`${demoResumeReport.matchScore}%`} accent="primary" hint="Stack & keyword alignment" />
                <DemoStat label="ATS readability" value={`${demoResumeReport.atsScore}%`} accent="success" hint="Parsed cleanly by ATS" />
                <DemoStat label="Clarity" value={`${demoResumeReport.clarityScore}%`} hint="Bullet structure & flow" />
                <DemoStat label="Impact" value={`${demoResumeReport.impactScore}%`} hint="Quantified outcomes" />
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Parsed sections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {demoResumeReport.parsedSections.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <p className="pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
                    Keyword hits
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {demoResumeReport.keywordHits.map((s) => (
                      <Badge key={s} className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400 text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">
                    Missing for target JD
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {demoResumeReport.keywordMisses.map((s) => (
                      <Badge key={s} variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                  </p>
                  <ul className="space-y-1.5 text-sm text-foreground/90">
                    {demoResumeReport.strengths.map((s) => (
                      <li key={s} className="flex gap-2"><span className="text-emerald-600">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">
                    <Target className="h-3.5 w-3.5" /> Suggested edits
                  </p>
                  <ul className="space-y-1.5 text-sm text-foreground/90">
                    {demoResumeReport.gaps.map((s) => (
                      <li key={s} className="flex gap-2"><span className="text-amber-600">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* INSTITUTION */}
          <TabsContent value="institution" className="space-y-6 focus-visible:outline-none">
            <Card className="overflow-hidden border-border/70">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-inset ring-primary/20">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary/80">
                        Institution demo
                      </p>
                      <p className="font-display text-lg font-semibold tracking-tight">
                        {demoInstitution.name}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Export cohort report
                  </Button>
                </div>
              </div>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <DemoStat label="Students" value={demoInstitution.students.toLocaleString()} />
                <DemoStat label="Departments" value={demoInstitution.departments} />
                <DemoStat label="Placement ready" value={`${demoInstitution.placementReady}%`} accent="success" />
                <DemoStat label="Avg readiness" value={demoInstitution.avgReadiness} accent="primary" />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="By department" description="Average readiness and % placement-ready.">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demoInstitution.byDepartment}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dept" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="avg" name="Avg readiness" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ready" name="% Ready" fill="oklch(0.72 0.16 160)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Department breakdown" description="Students, readiness average and ready cohort size.">
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Department</th>
                        <th className="px-3 py-2 text-right font-medium">Students</th>
                        <th className="px-3 py-2 text-right font-medium">Avg</th>
                        <th className="px-3 py-2 text-right font-medium">Ready %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {demoInstitution.byDepartment.map((d) => (
                        <tr key={d.dept} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-medium">{d.dept}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{d.students}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{d.avg}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{d.ready}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader>
            <CardTitle className="font-display text-xl">Ready to see this with your candidates?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm text-muted-foreground">
              Bring your job descriptions, talent pool or student cohort. We&apos;ll spin up a workspace,
              run a benchmark and walk you through the analytics that matter.
            </p>
            <div className="flex items-center gap-2">
              <Link to="/contact">
                <Button variant="outline" size="sm">Talk to us</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="gap-1.5">
                  Create a workspace <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
