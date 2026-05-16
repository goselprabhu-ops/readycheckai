import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  startAttempt,
  submitAttempt,
  getAssessmentAnalytics,
  getAssessmentLeaderboard,
} from "@/lib/assessment.functions";
import { toast } from "sonner";
import { ScorePill } from "@/components/common/ScorePill";
import {
  Database,
  Code2,
  FileText,
  CheckCircle2,
  XCircle,
  Timer as TimerIcon,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trophy,
  BarChart3,
  PieChart,
  Table as TableIcon,
  Sigma,
  Flame,
  Target,
  Crown,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/assessment")({
  component: AssessmentPage,
});

type Category = "sql" | "python" | "resume" | "power_bi" | "tableau" | "excel" | "statistics";
type Difficulty = "easy" | "medium" | "hard" | "mixed" | "adaptive";

interface AssessmentDef {
  id: string;
  category: Category;
  title: string;
  description: string | null;
  question_count: number;
}

interface Question {
  id: string;
  prompt: string;
  options: string[];
  points: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string | null;
}

interface ReviewItem {
  questionId: string;
  selected: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  topic: string | null;
  points: number;
}

interface TopicBreakdown {
  topic: string;
  earned: number;
  total: number;
  correct: number;
  count: number;
  pct: number;
}

interface DifficultyBreakdown extends Omit<TopicBreakdown, "topic"> {
  difficulty: string;
}

const SECONDS_PER_QUESTION = 45;

const CATEGORY_META: Record<Category, { icon: React.ReactNode; tone: string; label: string }> = {
  sql: { icon: <Database className="h-5 w-5" />, tone: "from-blue-500/15 to-blue-500/0", label: "SQL" },
  python: { icon: <Code2 className="h-5 w-5" />, tone: "from-emerald-500/15 to-emerald-500/0", label: "Python" },
  resume: { icon: <FileText className="h-5 w-5" />, tone: "from-amber-500/15 to-amber-500/0", label: "Resume" },
  power_bi: { icon: <BarChart3 className="h-5 w-5" />, tone: "from-yellow-500/15 to-yellow-500/0", label: "Power BI" },
  tableau: { icon: <PieChart className="h-5 w-5" />, tone: "from-indigo-500/15 to-indigo-500/0", label: "Tableau" },
  excel: { icon: <TableIcon className="h-5 w-5" />, tone: "from-green-600/15 to-green-600/0", label: "Excel" },
  statistics: { icon: <Sigma className="h-5 w-5" />, tone: "from-rose-500/15 to-rose-500/0", label: "Statistics" },
};

function AssessmentPage() {
  const [tab, setTab] = useState<"practice" | "analytics" | "leaderboard">("practice");
  const [defs, setDefs] = useState<AssessmentDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AssessmentDef | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [effectiveDifficulty, setEffectiveDifficulty] = useState<string>("medium");
  const [pickedDifficulty, setPickedDifficulty] = useState<Difficulty>("adaptive");
  const [result, setResult] = useState<{
    score: number;
    total: number;
    review: ReviewItem[];
    topicBreakdown: TopicBreakdown[];
    difficultyBreakdown: DifficultyBreakdown[];
  } | null>(null);
  const timerRef = useRef<number | null>(null);

  const startAttemptFn = useServerFn(startAttempt);
  const submitAttemptFn = useServerFn(submitAttempt);
  const analyticsFn = useServerFn(getAssessmentAnalytics);
  const leaderboardFn = useServerFn(getAssessmentLeaderboard);

  // Analytics & leaderboard state (lazy)
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof analyticsFn>> | null>(null);
  const [leaderboardAssessmentId, setLeaderboardAssessmentId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof leaderboardFn>> | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Load assessment definitions (SQL + Python only per spec) with question counts
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("assessment_definitions")
        .select("id, category, title, description, questions(count)")
        .in("category", ["sql", "python", "power_bi", "tableau", "excel", "statistics"])
        .eq("is_active", true);
      if (error) toast.error(error.message);
      const mapped: AssessmentDef[] = (data ?? []).map((d: any) => ({
        id: d.id,
        category: d.category,
        title: d.title,
        description: d.description,
        question_count: d.questions?.[0]?.count ?? 0,
      }));
      setDefs(mapped);
      setLoading(false);
      if (mapped.length && !leaderboardAssessmentId) setLeaderboardAssessmentId(mapped[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy-load analytics + leaderboard when their tab opens
  useEffect(() => {
    if (tab !== "analytics" || active || analytics) return;
    setAnalyticsLoading(true);
    analyticsFn()
      .then(setAnalytics)
      .catch((e: any) => toast.error(e?.message ?? "Could not load analytics"))
      .finally(() => setAnalyticsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, active]);

  useEffect(() => {
    if (tab !== "leaderboard" || active || !leaderboardAssessmentId) return;
    setLeaderboardLoading(true);
    leaderboardFn({ data: { assessmentId: leaderboardAssessmentId, limit: 25 } })
      .then(setLeaderboard)
      .catch((e: any) => toast.error(e?.message ?? "Could not load leaderboard"))
      .finally(() => setLeaderboardLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, active, leaderboardAssessmentId]);

  // Timer — driven by server-issued expiresAt so pausing JS / reloading
  // can't extend the clock.
  useEffect(() => {
    if (!active || result || !expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        void submit(true);
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, result, expiresAt]);

  const start = async (def: AssessmentDef, difficulty: Difficulty = pickedDifficulty) => {
    try {
      const res = await startAttemptFn({ data: { assessmentId: def.id, difficulty } });
      setQuestions(res.questions);
      setAttemptId(res.attemptId);
      setAnswers({});
      setIndex(0);
      setResult(null);
      setEffectiveDifficulty(res.effectiveDifficulty ?? "medium");
      // Sync countdown to server-issued expiry
      const expMs = new Date(res.expiresAt).getTime();
      setExpiresAt(expMs);
      setTimeLeft(Math.max(1, Math.ceil((expMs - Date.now()) / 1000)));
      setActive(def);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start assessment");
    }
  };

  const reset = () => {
    setActive(null);
    setQuestions([]);
    setAnswers({});
    setIndex(0);
    setResult(null);
    setAttemptId(null);
    setExpiresAt(null);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const submit = async (auto = false) => {
    if (!active || submitting || !attemptId) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const payload = {
        attemptId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selected: answers[q.id] ?? null,
        })),
      };
      const res = await submitAttemptFn({ data: payload });
      setResult({
        score: res.score,
        total: res.total,
        review: res.review as ReviewItem[],
        topicBreakdown: (res as any).topicBreakdown ?? [],
        difficultyBreakdown: (res as any).difficultyBreakdown ?? [],
      });
      // Refresh analytics next time the tab opens
      setAnalytics(null);
      if (auto) toast.message("Time's up — auto-submitted");
      else toast.success("Submitted");
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Catalog screen =====
  if (!active) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Skill Assessments</h1>
            <p className="text-sm text-muted-foreground mt-1">Certification-grade practice across the analytics stack.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Difficulty:</span>
            <Select value={pickedDifficulty} onValueChange={(v) => setPickedDifficulty(v as Difficulty)}>
              <SelectTrigger className="h-9 w-40 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adaptive">Adaptive (AI)</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="mt-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
          ) : defs.length === 0 ? (
            <div className="col-span-full text-center text-sm text-muted-foreground py-10">
              No assessments available yet.
            </div>
          ) : (
            defs.map((d) => {
              const meta = CATEGORY_META[d.category];
              return (
                <motion.button
                  key={d.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => start(d)}
                  className="text-left relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${meta.tone}`} />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                        {meta.icon}
                      </div>
                      <div>
                        <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{meta.label}</Badge>
                      </div>
                    </div>
                    <h3 className="font-display text-xl font-semibold mt-4">{d.title}</h3>
                    {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{d.question_count} questions</span>
                      <span className="flex items-center gap-1"><TimerIcon className="h-3.5 w-3.5" /> ~{Math.ceil((d.question_count * SECONDS_PER_QUESTION) / 60)} min</span>
                    </div>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                      Start <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsPanel data={analytics} loading={analyticsLoading} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm text-muted-foreground">Assessment:</span>
              <Select value={leaderboardAssessmentId} onValueChange={(v) => { setLeaderboardAssessmentId(v); setLeaderboard(null); }}>
                <SelectTrigger className="h-9 w-full sm:w-72 rounded-lg">
                  <SelectValue placeholder="Pick an assessment" />
                </SelectTrigger>
                <SelectContent>
                  {defs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {CATEGORY_META[d.category]?.label} — {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <LeaderboardPanel data={leaderboard} loading={leaderboardLoading} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ===== Result screen =====
  if (result) {
    const pct = Math.round((result.score / Math.max(1, result.total)) * 100);
    const correctCount = result.review.filter((r) => r.isCorrect).length;
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl overflow-hidden">
            <div
              className="p-8 text-white relative"
              style={{ background: "var(--gradient-panel-edge)" }}
            >
              <Trophy className="h-8 w-8 mb-3" />
              <div className="text-sm uppercase tracking-widest text-white/70">{active.title}</div>
              <div className="font-display text-5xl font-bold mt-1">{pct}%</div>
              <p className="text-white/80 mt-1">
                {result.score} / {result.total} points · {correctCount}/{result.review.length} correct
              </p>
            </div>
            <CardContent className="p-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={() => start(active)} className="rounded-xl">
                <RotateCcw className="h-4 w-4 mr-2" /> Retry
              </Button>
              <Button onClick={reset} className="rounded-xl">Back to assessments</Button>
            </CardContent>
          </Card>
        </motion.div>

        {(result.topicBreakdown.length > 0 || result.difficultyBreakdown.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {result.topicBreakdown.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Topic-wise score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.topicBreakdown.map((t) => (
                    <div key={t.topic} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{t.topic}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {t.correct}/{t.count} · {t.pct}%
                        </span>
                      </div>
                      <Progress value={t.pct} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {result.difficultyBreakdown.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" /> Difficulty breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.difficultyBreakdown.map((d) => (
                    <div key={d.difficulty} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{d.difficulty}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {d.correct}/{d.count} · {d.pct}%
                        </span>
                      </div>
                      <Progress value={d.pct} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Review</h2>
          <div className="space-y-3">
            {result.review.map((r, qi) => {
              const picked = r.selected;
              const correct = r.correctAnswer;
              return (
                <Card key={r.questionId} className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-start gap-2">
                      {r.isCorrect
                        ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                      <span className="flex-1">Q{qi + 1}. {r.prompt}</span>
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 mt-1 ml-7">
                      <Badge variant="outline" className="text-[10px] capitalize">{r.difficulty}</Badge>
                      {r.topic && <Badge variant="secondary" className="text-[10px]">{r.topic}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {r.options.map((opt) => {
                      const isCorrect = opt === correct;
                      const isPicked = opt === picked;
                      return (
                        <div
                          key={opt}
                          className={`text-sm rounded-lg border px-3 py-2 ${
                            isCorrect ? "border-primary bg-primary/5" :
                            isPicked ? "border-destructive bg-destructive/5" :
                            "border-border"
                          }`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                    {r.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        <span className="font-medium text-foreground">Why: </span>{r.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===== Quiz screen =====
  const q = questions[index];
  const answered = Object.keys(answers).length;
  const progress = ((index + 1) / questions.length) * 100;
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{CATEGORY_META[active.category]?.label ?? active.category}</Badge>
            <Badge variant="outline" className="uppercase text-[10px] tracking-wider capitalize">
              <Sparkles className="h-3 w-3 mr-1" /> {effectiveDifficulty}
            </Badge>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight mt-1 truncate">{active.title}</h1>
        </div>
        <div className={`flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-lg border ${timeLeft < 30 ? "border-destructive text-destructive" : "border-border"}`}>
          <TimerIcon className="h-4 w-4" /> {mins}:{secs}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {index + 1} of {questions.length}</span>
          <span>{answered} / {questions.length} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] capitalize">{q.difficulty}</Badge>
                {q.topic && <Badge variant="secondary" className="text-[10px]">{q.topic}</Badge>}
              </div>
              <CardTitle className="text-lg leading-snug">{q.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((opt) => {
                const picked = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                      picked
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-muted/40 hover:border-primary/30"
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full border-2 grid place-items-center ${picked ? "border-primary" : "border-muted-foreground/30"}`}>
                      {picked && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

        {/* Question navigator */}
        <Card className="rounded-2xl h-fit lg:sticky lg:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Question navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
              {questions.map((qq, i) => {
                const isAnswered = answers[qq.id] != null;
                const isActive = i === index;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setIndex(i)}
                    className={`h-9 w-full rounded-md text-xs font-medium border transition-all ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isAnswered
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                    title={`Q${i + 1}${isAnswered ? " · answered" : ""}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Current</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-primary/20 border border-primary/40" /> Answered</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-background border border-border" /> Skipped</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-4 rounded-lg"
              onClick={() => submit(false)}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={reset} className="rounded-xl">Quit</Button>
          {index === questions.length - 1 ? (
            <Button onClick={() => submit(false)} disabled={submitting} className="rounded-xl">
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          ) : (
            <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} className="rounded-xl">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Analytics + Leaderboard panels
// ============================================================================

function AnalyticsPanel({
  data,
  loading,
}: {
  data: Awaited<ReturnType<typeof getAssessmentAnalytics>> extends infer R ? R | null : never;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!data || data.totalAttempts === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No attempts yet. Take an assessment to see analytics.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.byCategory.map((c) => (
          <Card key={c.category} className="rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_META[c.category as Category]?.label ?? c.category}
                </CardTitle>
                <ScorePill score={c.bestPct} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average</span>
                <span className="font-medium tabular-nums">{c.avgPct}%</span>
              </div>
              <Progress value={c.avgPct} className="h-1.5" />
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">{c.attempts} attempt{c.attempts === 1 ? "" : "s"}</span>
                <span className="text-muted-foreground">Best {c.bestPct}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Recent attempts</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {data.recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="capitalize">{CATEGORY_META[r.category as Category]?.label ?? r.category}</span>
                  <span>·</span>
                  <span className="capitalize">{r.difficulty}</span>
                  <span>·</span>
                  <span>{new Date(r.completedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <ScorePill score={r.pct} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardPanel({
  data,
  loading,
}: {
  data: Awaited<ReturnType<typeof getAssessmentLeaderboard>> | null;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-72 rounded-2xl" />;
  }
  if (!data || data.leaderboard.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No completed attempts on this assessment yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" /> Top performers
          </CardTitle>
          {data.myRank && (
            <Badge variant="secondary" className="text-xs">Your rank: #{data.myRank}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {data.leaderboard.map((row) => (
            <div
              key={row.rank}
              className={`flex items-center justify-between px-6 py-3 text-sm ${row.isMe ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-semibold ${
                  row.rank === 1 ? "bg-amber-500/15 text-amber-600" :
                  row.rank === 2 ? "bg-zinc-400/15 text-zinc-600" :
                  row.rank === 3 ? "bg-orange-500/15 text-orange-600" :
                  "bg-muted text-muted-foreground"
                }`}>{row.rank}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{row.displayName}{row.isMe ? " (you)" : ""}</div>
                  <div className="text-xs text-muted-foreground">{row.attempts} attempt{row.attempts === 1 ? "" : "s"}</div>
                </div>
              </div>
              <ScorePill score={row.bestPct} label={`${row.bestScore}/${row.bestMax}`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}