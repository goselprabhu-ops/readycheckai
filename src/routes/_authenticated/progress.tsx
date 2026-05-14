import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Activity,
  Calendar,
  Database,
  Code2,
  FileText,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/progress")({
  component: ProgressPage,
});

interface Attempt {
  id: string;
  topic: string;
  score: number;
  total: number;
  created_at: string;
}
interface ResumeRow {
  id: string;
  ats_score: number;
  created_at: string;
}
interface ReadinessRow {
  id: string;
  readiness: number;
  sql_score: number;
  python_score: number;
  resume_score: number;
  level: string;
  computed_at: string;
}

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const pct = (s: number, t: number) => (t ? Math.round((s / t) * 100) : 0);

function ProgressPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [readiness, setReadiness] = useState<ReadinessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, r, h] = await Promise.all([
        supabase
          .from("assessments")
          .select("id, topic, score, total, created_at")
          .order("created_at", { ascending: true })
          .limit(200),
        supabase
          .from("resume_analyses")
          .select("id, ats_score, created_at")
          .order("created_at", { ascending: true })
          .limit(50),
        supabase
          .from("readiness_history")
          .select("id, readiness, sql_score, python_score, resume_score, level, computed_at")
          .order("computed_at", { ascending: true })
          .limit(100),
      ]);
      setAttempts((a.data ?? []) as Attempt[]);
      setResumes((r.data ?? []) as ResumeRow[]);
      setReadiness((h.data ?? []) as ReadinessRow[]);
      setLoading(false);
    })();
  }, []);

  const sqlSeries = useMemo(() => buildTopicSeries(attempts, "sql"), [attempts]);
  const pySeries = useMemo(() => buildTopicSeries(attempts, "python"), [attempts]);
  const resumeSeries = useMemo(
    () =>
      resumes.map((r, i) => ({
        idx: i + 1,
        date: shortDate(r.created_at),
        score: r.ats_score,
      })),
    [resumes],
  );
  const readinessSeries = useMemo(
    () =>
      readiness.map((r, i) => ({
        idx: i + 1,
        date: shortDate(r.computed_at),
        Readiness: r.readiness,
        SQL: r.sql_score,
        Python: r.python_score,
        Resume: r.resume_score,
      })),
    [readiness],
  );

  const stats = useMemo(() => {
    const all = [...sqlSeries, ...pySeries].map((p) => p.score);
    const best = all.length ? Math.max(...all) : 0;
    const total = attempts.length;
    const last =
      [...attempts]
        .map((a) => new Date(a.created_at).getTime())
        .concat(resumes.map((r) => new Date(r.created_at).getTime()))
        .concat(readiness.map((r) => new Date(r.computed_at).getTime()))
        .sort((a, b) => b - a)[0] ?? null;
    const improvement = computeImprovement(readinessSeries.map((r) => r.Readiness));
    return { best, total, last, improvement };
  }, [sqlSeries, pySeries, attempts, resumes, readiness, readinessSeries]);

  const empty =
    !loading &&
    attempts.length === 0 &&
    resumes.length === 0 &&
    readiness.length === 0;

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.26 0.13 265) 0%, oklch(0.38 0.18 262) 50%, oklch(0.55 0.22 260) 100%)",
          }}
        />
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-10 text-white">
          <motion.div initial="hidden" animate="show" variants={fade}>
            <div className="text-xs uppercase tracking-widest text-white/70">
              ReadyCheck Lab
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
              Your progress &amp; growth
            </h1>
            <p className="text-white/80 mt-2 max-w-xl">
              Every attempt counts. Track improvements across SQL, Python, and resume to
              keep your career trajectory pointed up and to the right.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 -mt-10 relative z-10 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          ) : (
            <>
              <MetricCard
                delay={0}
                icon={<Trophy className="h-4 w-4" />}
                label="Best score"
                value={`${stats.best}%`}
                helper="Across all assessments"
              />
              <MetricCard
                delay={1}
                icon={<Activity className="h-4 w-4" />}
                label="Attempts completed"
                value={`${stats.total}`}
                helper="Keep them coming"
              />
              <MetricCard
                delay={2}
                icon={
                  stats.improvement >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )
                }
                label="Improvement"
                value={`${stats.improvement >= 0 ? "+" : ""}${stats.improvement}%`}
                helper="Readiness vs first snapshot"
                tone={stats.improvement >= 0 ? "positive" : "negative"}
              />
              <MetricCard
                delay={3}
                icon={<Calendar className="h-4 w-4" />}
                label="Latest activity"
                value={stats.last ? relativeDate(stats.last) : "—"}
                helper={stats.last ? new Date(stats.last).toLocaleDateString() : "No activity yet"}
              />
            </>
          )}
        </div>

        {empty && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-10 text-center space-y-3">
              <Sparkles className="h-6 w-6 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                No progress data yet. Take an assessment or analyze your resume to
                start tracking your growth.
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild size="sm">
                  <Link to="/assessment">Take assessment</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/resume">Upload resume</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall readiness growth */}
        <motion.div custom={4} initial="hidden" animate="show" variants={fade}>
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Overall readiness growth
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Composite readiness with sub-score breakdown
                </p>
              </div>
              {readinessSeries.length > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {readinessSeries[readinessSeries.length - 1].Readiness}%
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full rounded-xl" />
              ) : readinessSeries.length === 0 ? (
                <EmptyChart text="Recompute readiness on the dashboard to start tracking history." />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer>
                    <AreaChart data={readinessSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gReadyP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <ReferenceLine y={70} stroke="oklch(0.7 0.15 150)" strokeDasharray="4 4" label={{ value: "Interview ready", position: "right", fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <Area type="monotone" dataKey="Readiness" stroke="var(--primary)" strokeWidth={2.5} fill="url(#gReadyP)" />
                      <Line type="monotone" dataKey="SQL" stroke="oklch(0.6 0.18 250)" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="Python" stroke="oklch(0.65 0.18 160)" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="Resume" stroke="oklch(0.7 0.18 30)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* SQL + Python */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopicChart
            delay={5}
            title="SQL improvement"
            icon={<Database className="h-4 w-4" />}
            color="oklch(0.6 0.18 250)"
            data={sqlSeries}
            loading={loading}
            href="/assessment"
          />
          <TopicChart
            delay={6}
            title="Python improvement"
            icon={<Code2 className="h-4 w-4" />}
            color="oklch(0.65 0.18 160)"
            data={pySeries}
            loading={loading}
            href="/assessment"
          />
        </div>

        {/* Resume + recent attempts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div custom={7} initial="hidden" animate="show" variants={fade} className="lg:col-span-2">
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Resume score trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">ATS score per analysis</p>
                </div>
                {resumeSeries.length > 0 && (
                  <DeltaBadge series={resumeSeries.map((r) => r.score)} />
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-56 w-full rounded-xl" />
                ) : resumeSeries.length === 0 ? (
                  <EmptyChart
                    text="Upload a resume to start your trend."
                    action={
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link to="/resume">Analyze resume</Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer>
                      <LineChart data={resumeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                        <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="score" stroke="oklch(0.7 0.18 30)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div custom={8} initial="hidden" animate="show" variants={fade}>
            <GlassCard>
              <CardHeader>
                <CardTitle>Recent attempts</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Last 6 results</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : attempts.length === 0 ? (
                  <EmptyChart text="No attempts yet." />
                ) : (
                  <ul className="divide-y divide-border">
                    {[...attempts]
                      .reverse()
                      .slice(0, 6)
                      .map((a) => {
                        const p = pct(a.score, a.total);
                        return (
                          <li key={a.id} className="flex items-center justify-between py-2.5">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{a.topic}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(a.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant={p >= 70 ? "default" : "secondary"} className="font-mono">
                              {p}%
                            </Badge>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function buildTopicSeries(attempts: Attempt[], needle: string) {
  return attempts
    .filter((a) => a.topic.toLowerCase().includes(needle))
    .map((a, i) => ({
      idx: i + 1,
      date: shortDate(a.created_at),
      score: pct(a.score, a.total),
    }));
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function relativeDate(ts: number) {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function computeImprovement(series: number[]) {
  if (series.length < 2) return 0;
  const first = series[0];
  const last = series[series.length - 1];
  if (!first) return last;
  return Math.round(((last - first) / first) * 100);
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
};

/* ---------- subcomponents ---------- */

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 backdrop-blur-md shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
      {children}
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  delay = 0,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  delay?: number;
  tone?: "positive" | "negative";
}) {
  const toneClass =
    tone === "negative"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : "";
  return (
    <motion.div custom={delay} initial="hidden" animate="show" variants={fade}>
      <GlassCard>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            {icon} {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-semibold font-display ${toneClass}`}>{value}</div>
          {helper && <p className="text-xs text-muted-foreground mt-1 truncate">{helper}</p>}
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

function TopicChart({
  title,
  icon,
  color,
  data,
  loading,
  href,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  data: { date: string; score: number }[];
  loading: boolean;
  href: string;
  delay?: number;
}) {
  const best = data.length ? Math.max(...data.map((d) => d.score)) : 0;
  return (
    <motion.div custom={delay} initial="hidden" animate="show" variants={fade}>
      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon} {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {data.length} attempt{data.length === 1 ? "" : "s"} · best {best}%
            </p>
          </div>
          <DeltaBadge series={data.map((d) => d.score)} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : data.length === 0 ? (
            <EmptyChart
              text="No attempts yet."
              action={
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to={href}>
                    Take {title.split(" ")[0]} assessment
                    <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={70} stroke="oklch(0.7 0.15 150)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

function DeltaBadge({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const delta = series[series.length - 1] - series[0];
  const positive = delta >= 0;
  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs ${
        positive
          ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
          : "text-rose-600 border-rose-500/30 bg-rose-500/10"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
      {positive ? "+" : ""}
      {delta} pts
    </Badge>
  );
}

function EmptyChart({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10">
      <p className="text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}