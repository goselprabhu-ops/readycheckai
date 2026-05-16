import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/common/MetricCard";
import { ScorePill } from "@/components/common/ScorePill";
import { PageContainer } from "@/components/layouts/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import {
  createInterviewV1,
  submitInterviewAnswer,
  finalizeInterview,
  listInterviewSessions,
  getInterviewReadiness,
  INTERVIEW_CATEGORIES,
} from "@/lib/interview.functions";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { Clock, Send, Sparkles, Trophy, MessageSquare, Activity, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/interview")({
  component: InterviewPage,
});

type PlanItem = {
  key: string;
  type: "mcq" | "coding" | "analytical" | "dashboard" | "behavioral";
  category: string;
  prompt: string;
  options?: string[];
  expected_topics: string[];
  time_seconds: number;
};
type AnswerEval = {
  correctness: number; clarity: number; structure: number;
  confidence: number; communication: number;
  strengths: string[]; improvements: string[]; ideal_answer: string;
};

function formatTime(s: number) {
  const m = Math.floor(Math.max(0, s) / 60);
  const r = Math.max(0, s) % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function InterviewPage() {
  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Mock Interview"
        description="Recruiter-grade simulations across SQL, Python, Power BI, statistics, case studies and behavioral rounds."
      />
      <Tabs defaultValue="practice" className="space-y-6">
        <TabsList>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="practice" className="space-y-4">
          <PracticePane />
        </TabsContent>
        <TabsContent value="readiness" className="space-y-4">
          <ReadinessPane />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <HistoryPane />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function PracticePane() {
  const [role, setRole] = useState("Data Analyst");
  const [category, setCategory] = useState<(typeof INTERVIEW_CATEGORIES)[number]["key"]>("mixed");
  const [difficulty, setDifficulty] = useState<"easy" | "standard" | "hard">("standard");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastEval, setLastEval] = useState<AnswerEval | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScores, setFinalScores] = useState<{ technical: number; communication: number; confidence: number; overall: number } | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<any>(null);

  const create = useServerFn(createInterviewV1);
  const submit = useServerFn(submitInterviewAnswer);
  const finish = useServerFn(finalizeInterview);

  const current = plan[index];
  const totalDuration = useMemo(() => plan.reduce((s, q) => s + q.time_seconds, 0), [plan]);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const tickRef = useRef<number | null>(null);

  // Per-question timer
  useEffect(() => {
    if (!current || completed) return;
    setQuestionStartedAt(Date.now());
    setSecondsLeft(current.time_seconds);
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [current?.key, completed]);

  const onStart = async () => {
    setLoading(true);
    setLastEval(null);
    setCompleted(false);
    setFinalScores(null);
    setFinalFeedback(null);
    try {
      const r = await create({ data: { category, roleTarget: role, difficulty } });
      setSessionId(r.sessionId);
      setPlan(r.plan as PlanItem[]);
      setIndex(0);
      void track("interview_started", { properties: { category, role, difficulty } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!sessionId || !current || !answer.trim()) return;
    setLoading(true);
    try {
      const timeMs = questionStartedAt ? Date.now() - questionStartedAt : undefined;
      const r = await submit({ data: { sessionId, answer: answer.trim(), timeMs } });
      setLastEval(r.evaluation as AnswerEval);
      setAnswer("");
      if (r.done) {
        const fin = await finish({ data: { sessionId } });
        if (!fin.alreadyComplete) {
          setFinalScores(fin.scores ?? null);
          setFinalFeedback(fin.feedback ?? null);
        }
        setCompleted(true);
        void track("interview_completed", { properties: { sessionId, scores: fin.scores ?? null } });
      } else {
        setIndex((i) => i + 1);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setSessionId(null); setPlan([]); setIndex(0); setAnswer("");
    setLastEval(null); setCompleted(false); setFinalScores(null); setFinalFeedback(null);
  };

  if (!sessionId) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-xl">Start a new mock interview</CardTitle>
          <CardDescription>Pick a category, role and difficulty. The AI interviewer designs a 5–6 question loop tailored to your target.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVIEW_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button onClick={onStart} disabled={loading}>
              <Sparkles className="h-4 w-4" /> {loading ? "Designing interview…" : "Start interview"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <div className="space-y-6">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-xl">Interview complete</CardTitle>
            </div>
            <CardDescription>{finalFeedback?.summary ?? "Great work. Review your scores and the next steps."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Overall readiness" value={finalScores?.overall ?? 0} icon={Trophy} />
            <MetricCard label="Technical" value={finalScores?.technical ?? 0} icon={Target} />
            <MetricCard label="Communication" value={finalScores?.communication ?? 0} icon={MessageSquare} />
            <MetricCard label="Confidence" value={finalScores?.confidence ?? 0} icon={Activity} />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <FeedbackCard title="Strengths" items={finalFeedback?.strengths ?? []} tone="positive" />
          <FeedbackCard title="Improvements" items={finalFeedback?.improvements ?? []} tone="warning" />
          <FeedbackCard title="Next steps" items={finalFeedback?.next_steps ?? []} tone="info" />
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset}>Run another interview</Button>
        </div>
      </div>
    );
  }

  const pct = plan.length ? Math.round(((index) / plan.length) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="border-border/60">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardDescription className="uppercase tracking-wide text-xs">
                Question {Math.min(index + 1, plan.length)} of {plan.length} · {current?.category} · {current?.type}
              </CardDescription>
              <CardTitle className="font-display text-xl leading-snug">{current?.prompt}</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium tabular-nums text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(secondsLeft)}
            </div>
          </div>
          <Progress value={pct} />
        </CardHeader>
        <CardContent className="space-y-4">
          {current?.options?.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(opt)}
                  className={`rounded-md border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    answer === opt ? "bg-primary/10 border-primary" : ""
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="answer">Your answer</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                current?.type === "coding"
                  ? "Write your SQL / Python here. Explain your approach in 1–2 lines."
                  : "Structure your answer (situation → action → result for behavioral)."
              }
              rows={current?.type === "coding" ? 8 : 6}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Total session target: {formatTime(totalDuration)} · Press Submit to score & advance.
            </p>
            <Button onClick={onSubmit} disabled={loading || !answer.trim()}>
              <Send className="h-4 w-4" />
              {loading ? "Scoring…" : index + 1 === plan.length ? "Submit & finish" : "Submit & next"}
            </Button>
          </div>

          {lastEval ? (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Previous answer feedback
                </span>
                <ScorePill score={lastEval.correctness} label="correct" />
                <ScorePill score={lastEval.clarity} label="clarity" />
                <ScorePill score={lastEval.structure} label="structure" />
                <ScorePill score={lastEval.confidence} label="confidence" />
              </div>
              {lastEval.strengths?.length ? (
                <p className="text-sm"><span className="font-medium">Strengths:</span> {lastEval.strengths.join("; ")}</p>
              ) : null}
              {lastEval.improvements?.length ? (
                <p className="text-sm"><span className="font-medium">Improve:</span> {lastEval.improvements.join("; ")}</p>
              ) : null}
              {lastEval.ideal_answer ? (
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Model answer hint: </span>{lastEval.ideal_answer}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/60 h-fit">
        <CardHeader>
          <CardTitle className="text-base">Interview plan</CardTitle>
          <CardDescription>{role} · {INTERVIEW_CATEGORIES.find(c => c.key === category)?.label}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {plan.map((q, i) => (
            <div
              key={q.key}
              className={`flex items-start gap-3 rounded-md border border-border/40 p-2 ${
                i === index ? "bg-primary/5 border-primary/40" : i < index ? "opacity-60" : ""
              }`}
            >
              <Badge variant="outline" className="shrink-0">{i + 1}</Badge>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{q.type} · {formatTime(q.time_seconds)}</p>
                <p className="text-sm leading-snug line-clamp-2">{q.prompt}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackCard({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "warning" | "info" }) {
  const toneClass =
    tone === "positive" ? "border-emerald-500/30 bg-emerald-500/5"
    : tone === "warning" ? "border-amber-500/30 bg-amber-500/5"
    : "border-primary/30 bg-primary/5";
  return (
    <Card className={`border ${toneClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-1.5 text-sm">
            {items.map((s, i) => <li key={i} className="leading-snug">• {s}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No items.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReadinessPane() {
  const fetchReadiness = useServerFn(getInterviewReadiness);
  const { data, isLoading } = useQuery({
    queryKey: ["interview-readiness"],
    queryFn: () => fetchReadiness(),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading readiness…</p>;
  const t = data?.totals ?? { overall: 0, technical: 0, communication: 0, confidence: 0, sessions: 0 };
  const cats = data?.categories ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Overall readiness" value={t.overall} icon={Trophy} hint={`${t.sessions} completed sessions`} />
        <MetricCard label="Technical" value={t.technical} icon={Target} />
        <MetricCard label="Communication" value={t.communication} icon={MessageSquare} />
        <MetricCard label="Confidence" value={t.confidence} icon={Activity} />
      </div>
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Performance by category</CardTitle>
          <CardDescription>Average overall score per interview category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete an interview to see category breakdown.</p>
          ) : cats.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground tabular-nums">{c.overall} · {c.count} session{c.count === 1 ? "" : "s"}</span>
              </div>
              <Progress value={c.overall} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryPane() {
  const fetchList = useServerFn(listInterviewSessions);
  const { data, isLoading } = useQuery({
    queryKey: ["interview-sessions"],
    queryFn: () => fetchList(),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history…</p>;
  const sessions = data?.sessions ?? [];
  if (!sessions.length) {
    return <p className="text-sm text-muted-foreground">No interviews yet. Run your first mock from the Practice tab.</p>;
  }
  return (
    <Card className="border-border/60">
      <CardContent className="p-0 divide-y divide-border/60">
        {sessions.map((s: any) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium">
                {s.role_target} · <span className="text-muted-foreground">{INTERVIEW_CATEGORIES.find(c => c.key === s.category)?.label ?? s.category}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString()} · {s.difficulty} · {s.status}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {s.status === "completed" ? (
                <>
                  <ScorePill score={s.overall_score ?? 0} label="overall" />
                  <ScorePill score={s.technical_score ?? 0} label="tech" />
                  <ScorePill score={s.communication_score ?? 0} label="comm" />
                  <ScorePill score={s.confidence_score ?? 0} label="conf" />
                </>
              ) : (
                <Badge variant="outline">In progress</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}