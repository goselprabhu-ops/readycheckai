import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/score-ring";
const ReadinessPanel = lazy(() =>
  import("@/components/readiness-panel").then((m) => ({ default: m.ReadinessPanel })),
);
const RecommendationsPanel = lazy(() =>
  import("@/components/recommendations-panel").then((m) => ({ default: m.RecommendationsPanel })),
);
import { supabase } from "@/integrations/supabase/client";
import { recomputeEmployability } from "@/lib/employability.functions";
import {
  FileText,
  Brain,
  Database,
  Code2,
  Sparkles,
  TrendingUp,
  Target,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const ReadinessAreaChart = lazy(() =>
  import("@/components/dashboard-charts").then((m) => ({ default: m.ReadinessAreaChart })),
);
const AttemptsBarChart = lazy(() =>
  import("@/components/dashboard-charts").then((m) => ({ default: m.AttemptsBarChart })),
);

const ChartFallback = () => <Skeleton className="h-56 w-full rounded-xl" />;

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface Score {
  resume_score: number;
  skills_score: number;
  market_fit: number;
  composite: number;
  computed_at?: string;
}

interface Attempt {
  id: string;
  topic: string;
  score: number;
  total: number;
  created_at: string;
}

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function pct(score: number, total: number) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

function topicLatest(attempts: Attempt[], topic: string) {
  const a = attempts.find((x) => x.topic.toLowerCase().includes(topic));
  return a ? pct(a.score, a.total) : 0;
}

function Dashboard() {
  const [score, setScore] = useState<Score | null>(null);
  const [scoreHistory, setScoreHistory] = useState<Score[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const [name, setName] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const recompute = useServerFn(recomputeEmployability);
  const nav = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/login" });
  };

  const load = async () => {
    const [{ data: s }, { data: hist }, { data: at }, { data: sk }, { data: u }] =
      await Promise.all([
        supabase
          .from("employability_scores")
          .select("*")
          .order("computed_at", { ascending: false })
          .limit(1),
        supabase
          .from("employability_scores")
          .select("composite, resume_score, skills_score, market_fit, computed_at")
          .order("computed_at", { ascending: true })
          .limit(20),
        supabase
          .from("assessments")
          .select("id, topic, score, total, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("skills")
          .select("name, level")
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase.auth.getUser(),
      ]);
    if (s && s[0]) setScore(s[0] as Score);
    setScoreHistory((hist ?? []) as Score[]);
    setAttempts((at ?? []) as Attempt[]);
    setSkills((sk ?? []) as any);
    const meta = u?.user?.user_metadata as { full_name?: string } | undefined;
    setName(meta?.full_name || u?.user?.email?.split("@")[0] || "there");
    // Treat as new user if account created within last 5 minutes or no prior sign-in
    const createdAt = u?.user?.created_at ? new Date(u.user.created_at).getTime() : 0;
    const lastSignIn = u?.user?.last_sign_in_at ? new Date(u.user.last_sign_in_at).getTime() : 0;
    const newish = createdAt && Date.now() - createdAt < 5 * 60 * 1000;
    setIsNewUser(Boolean(newish || !lastSignIn || Math.abs(lastSignIn - createdAt) < 60 * 1000));
    setInitialLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRecompute = async () => {
    setLoading(true);
    try {
      const r = await recompute();
      setScore(r as Score);
      toast.success("Readiness score updated");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const sql = useMemo(() => topicLatest(attempts, "sql"), [attempts]);
  const python = useMemo(() => topicLatest(attempts, "python"), [attempts]);

  const chartData = useMemo(
    () =>
      scoreHistory.map((h, i) => ({
        idx: i + 1,
        date: h.computed_at ? new Date(h.computed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `${i + 1}`,
        Readiness: h.composite,
        Resume: h.resume_score,
        Skills: h.skills_score,
      })),
    [scoreHistory],
  );

  const attemptChart = useMemo(
    () =>
      [...attempts]
        .reverse()
        .map((a) => ({
          date: new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          topic: a.topic,
          score: pct(a.score, a.total),
        })),
    [attempts],
  );

  return (
    <div className="min-h-full">
      {/* Glossy navy hero header */}
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
          <motion.div initial="hidden" animate="show" variants={fade} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70">ReadyCheck Lab</div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
                {initialLoading ? "…" : isNewUser ? `Welcome to ReadyCheck, ${name}` : `Welcome back, ${name}`}
              </h1>
              <p className="text-white/80 mt-2 max-w-xl">
                Measure. Learn. Improve. Here's where you stand on your Data Analyst readiness today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onRecompute} disabled={loading} className="bg-white text-primary hover:bg-white/90 rounded-xl shadow-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? "Computing…" : "Recompute readiness"}
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 -mt-10 relative z-10 space-y-6">
        {/* Readiness scoring engine */}
        <motion.div initial="hidden" animate="show" variants={fade}>
          <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
            <ReadinessPanel />
          </Suspense>
        </motion.div>

        {/* Overall + 3 score cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {initialLoading ? (
            <>
              <Skeleton className="h-44 md:col-span-2 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl md:col-start-2" />
            </>
          ) : (
            <>
              <motion.div custom={0} initial="hidden" animate="show" variants={fade} className="md:col-span-2">
                <GlassCard>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall readiness</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-6">
                    <ScoreRing value={score?.composite ?? 0} label="composite" />
                    <div className="space-y-1.5 text-sm">
                      <Row label="Resume ATS" value={score?.resume_score ?? 0} />
                      <Row label="Skills" value={score?.skills_score ?? 0} />
                      <Row label="Market Fit" value={score?.market_fit ?? 0} />
                    </div>
                  </CardContent>
                </GlassCard>
              </motion.div>

              <ScoreCard delay={1} title="SQL" icon={<Database className="h-4 w-4" />} value={sql} href="/assessment" cta="Take SQL test" />
              <ScoreCard delay={2} title="Python" icon={<Code2 className="h-4 w-4" />} value={python} href="/assessment" cta="Take Python test" />
              <ScoreCard delay={3} title="Resume" icon={<FileText className="h-4 w-4" />} value={score?.resume_score ?? 0} href="/resume" cta="Analyze resume" />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div custom={4} initial="hidden" animate="show" variants={fade} className="lg:col-span-2">
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Readiness over time</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Composite, resume and skills trend</p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {initialLoading ? (
                  <Skeleton className="h-56 w-full rounded-xl" />
                ) : chartData.length === 0 ? (
                  <EmptyState text="Recompute readiness to start tracking history." />
                ) : (
                  <Suspense fallback={<ChartFallback />}>
                    <ReadinessAreaChart data={chartData} />
                  </Suspense>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div custom={5} initial="hidden" animate="show" variants={fade}>
            <GlassCard>
              <CardHeader>
                <CardTitle>Assessment scores</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Recent attempts (% correct)</p>
              </CardHeader>
              <CardContent>
                {initialLoading ? (
                  <Skeleton className="h-56 w-full rounded-xl" />
                ) : attemptChart.length === 0 ? (
                  <EmptyState text="No attempts yet." />
                ) : (
                  <Suspense fallback={<ChartFallback />}>
                    <AttemptsBarChart data={attemptChart} />
                  </Suspense>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>

        {/* Recommendations + Recent attempts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div custom={6} initial="hidden" animate="show" variants={fade} className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
              <RecommendationsPanel />
            </Suspense>
          </motion.div>

          <motion.div custom={7} initial="hidden" animate="show" variants={fade}>
            <GlassCard>
              <CardHeader>
                <CardTitle>Recent attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {initialLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                  </div>
                ) : attempts.length === 0 ? (
                  <EmptyState text="No assessments yet." action={<Button asChild size="sm" variant="outline" className="mt-3"><Link to="/assessment"><Brain className="h-4 w-4 mr-2" />Take one now</Link></Button>} />
                ) : (
                  <ul className="divide-y divide-border">
                    {attempts.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-2.5">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{a.topic}</div>
                          <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</div>
                        </div>
                        <Badge variant={pct(a.score, a.total) >= 70 ? "default" : "secondary"} className="font-mono">
                          {pct(a.score, a.total)}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>

        {/* Skills + quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div custom={8} initial="hidden" animate="show" variants={fade}>
            <GlassCard>
              <CardHeader><CardTitle>Detected skills</CardTitle></CardHeader>
              <CardContent>
                {initialLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
                  </div>
                ) : skills.length === 0 ? (
                  <EmptyState text="No skills yet. Analyze your resume or take an assessment." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {s.name} <span className="font-mono text-xs opacity-70">{s.level}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div custom={9} initial="hidden" animate="show" variants={fade}>
            <GlassCard>
              <CardHeader><CardTitle>Next steps</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary/5">
                  <Link to="/roadmap"><Target className="h-4 w-4 mr-2" />Generate adaptive roadmap</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary/5">
                  <Link to="/interview"><MessageSquare className="h-4 w-4 mr-2" />Practice mock interview</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary/5">
                  <Link to="/results"><TrendingUp className="h-4 w-4 mr-2" />View detailed results</Link>
                </Button>
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 backdrop-blur-md shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs w-8 text-right">{value}</span>
    </div>
  );
}

function ScoreCard({
  title, icon, value, href, cta, delay = 0,
}: { title: string; icon: React.ReactNode; value: number; href: string; cta: string; delay?: number }) {
  return (
    <motion.div custom={delay} initial="hidden" animate="show" variants={fade}>
      <GlassCard>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <ScoreRing value={value} label="score" size={100} />
          <Button asChild variant="outline" size="sm" className="w-full mt-3 rounded-xl">
            <Link to={href}>{cta}</Link>
          </Button>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <p className="text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}