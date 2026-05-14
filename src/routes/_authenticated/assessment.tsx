import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { startAttempt, submitAttempt } from "@/lib/assessment.functions";
import { toast } from "sonner";
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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/assessment")({
  component: AssessmentPage,
});

type Category = "sql" | "python" | "resume" | "power_bi" | "tableau" | "excel" | "statistics";

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
  const [defs, setDefs] = useState<AssessmentDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AssessmentDef | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number; review: ReviewItem[] } | null>(null);
  const timerRef = useRef<number | null>(null);

  const startAttemptFn = useServerFn(startAttempt);
  const submitAttemptFn = useServerFn(submitAttempt);

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
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (!active || result) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timerRef.current!);
          void submit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, result]);

  const start = async (def: AssessmentDef) => {
    try {
      const res = await startAttemptFn({ data: { assessmentId: def.id } });
      setQuestions(res.questions);
      setAttemptId(res.attemptId);
      setAnswers({});
      setIndex(0);
      setResult(null);
      // Use server-issued duration; fall back to client estimate if missing
      const elapsedMs = Date.now() - new Date(res.startedAt).getTime();
      const remaining = Math.max(1, res.durationSeconds - Math.floor(elapsedMs / 1000));
      setTimeLeft(remaining);
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
      setResult({ score: res.score, total: res.total, review: res.review });
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
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Skill Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick an assessment to measure your readiness.</p>
        </div>
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
      </div>
    );
  }

  // ===== Result screen =====
  if (result) {
    const pct = Math.round((result.score / Math.max(1, result.total)) * 100);
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl overflow-hidden">
            <div
              className="p-8 text-white relative"
              style={{ background: "linear-gradient(135deg, oklch(0.28 0.13 265), oklch(0.55 0.22 260))" }}
            >
              <Trophy className="h-8 w-8 mb-3" />
              <div className="text-sm uppercase tracking-widest text-white/70">{active.title}</div>
              <div className="font-display text-5xl font-bold mt-1">{pct}%</div>
              <p className="text-white/80 mt-1">{result.score} / {result.total} points</p>
            </div>
            <CardContent className="p-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={() => start(active)} className="rounded-xl">
                <RotateCcw className="h-4 w-4 mr-2" /> Retry
              </Button>
              <Button onClick={reset} className="rounded-xl">Back to assessments</Button>
            </CardContent>
          </Card>
        </motion.div>

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
                      <span>Q{qi + 1}. {r.prompt}</span>
                    </CardTitle>
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
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{CATEGORY_META[active.category]?.label ?? active.category}</Badge>
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