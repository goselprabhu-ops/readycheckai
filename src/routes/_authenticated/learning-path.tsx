import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  TrendingUp,
  Rocket,
  BookOpen,
  FlaskConical,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import {
  generateLearningPath,
  getActiveLearningPath,
  setLearningItemStatus,
} from "@/lib/learning-path.functions";

export const Route = createFileRoute("/_authenticated/learning-path")({
  component: LearningPathPage,
});

type ItemType = "concept" | "practice" | "project" | "reading" | "assessment";
type Priority = "high" | "medium" | "low";
type ItemStatus = "pending" | "in_progress" | "done";

interface PathItem {
  key: string;
  title: string;
  type: ItemType;
  est_hours: number;
  resource_url?: string | null;
  priority: Priority;
}
interface PathWeek {
  week: number;
  theme: string;
  outcome: string;
  items: PathItem[];
}
interface PathProject {
  title: string;
  summary: string;
  stack: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  est_hours: number;
  outcome: string;
}
interface HeatmapEntry {
  skill: string;
  current: number;
  target: number;
  demand: "low" | "medium" | "high";
  gap_priority: "low" | "medium" | "high";
}

const TYPE_ICON: Record<ItemType, typeof BookOpen> = {
  concept: BookOpen,
  practice: FlaskConical,
  project: Rocket,
  reading: FileText,
  assessment: ClipboardCheck,
};

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
};

const ROLE_OPTIONS = [
  "Data Analyst",
  "Business Analyst",
  "BI Analyst",
  "Junior Data Scientist",
];

function heatmapColor(gap: number): string {
  // gap is positive = behind target
  if (gap >= 50) return "bg-rose-500";
  if (gap >= 30) return "bg-orange-500";
  if (gap >= 15) return "bg-amber-500";
  if (gap > 0) return "bg-yellow-400";
  return "bg-emerald-500";
}

function LearningPathPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState("Data Analyst");
  const [path, setPath] = useState<any | null>(null);
  const [progress, setProgress] = useState<Record<string, ItemStatus>>({});
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({});

  const load = useServerFn(getActiveLearningPath);
  const gen = useServerFn(generateLearningPath);
  const setStatus = useServerFn(setLearningItemStatus);

  useEffect(() => {
    (async () => {
      try {
        const r = await load({});
        if (r.path) {
          setPath(r.path);
          setRole(r.path.target_role ?? "Data Analyst");
          const map: Record<string, ItemStatus> = {};
          for (const p of r.progress as { item_key: string; status: ItemStatus }[]) {
            map[p.item_key] = p.status;
          }
          setProgress(map);
          // Open the first incomplete week.
          const weeks = ((r.path.weeks ?? []) as unknown) as PathWeek[];
          const firstOpen = weeks.find((w) =>
            w.items.some((i) => map[i.key] !== "done"),
          );
          if (firstOpen) setOpenWeeks({ [firstOpen.week]: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const r = await gen({ data: { targetRole: role, weeks: 4 } });
      setPath(r.path);
      setProgress({});
      setOpenWeeks({ 1: true });
      toast.success("AI roadmap generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const cycleStatus = async (item: PathItem) => {
    if (!path) return;
    const cur = progress[item.key] ?? "pending";
    const next: ItemStatus =
      cur === "pending" ? "in_progress" : cur === "in_progress" ? "done" : "pending";
    setProgress({ ...progress, [item.key]: next });
    try {
      await setStatus({ data: { pathId: path.id, itemKey: item.key, status: next } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
      setProgress({ ...progress, [item.key]: cur });
    }
  };

  const weeks: PathWeek[] = path?.weeks ?? [];
  const heatmap: HeatmapEntry[] = path?.skill_heatmap ?? [];
  const projects: PathProject[] = path?.projects ?? [];

  const totals = useMemo(() => {
    let total = 0;
    let done = 0;
    let hours = 0;
    let doneHours = 0;
    for (const w of weeks) {
      for (const it of w.items) {
        total += 1;
        hours += it.est_hours;
        if (progress[it.key] === "done") {
          done += 1;
          doneHours += it.est_hours;
        }
      }
    }
    return {
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
      hours,
      doneHours,
    };
  }, [weeks, progress]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        eyebrow="AI Career Coach"
        title="Your adaptive learning path"
        description="Personalised weekly roadmap, skill heatmap and recruiter-ready projects."
        actions={
          <div className="flex items-center gap-2">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onGenerate} disabled={generating} className="rounded-xl">
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />{path ? "Regenerate" : "Generate plan"}</>
              )}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : !path ? (
        <SectionCard title="Get started">
          <EmptyState
            icon={Sparkles}
            title="No active learning path"
            description="Generate an AI roadmap tailored to your assessments, resume and readiness scores."
            action={
              <Button onClick={onGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate my roadmap"}
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <>
          {/* Focus + progress summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-gradient-to-br from-primary/5 via-card to-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Focus for {path.target_role}
                </div>
                <CardTitle className="text-lg leading-snug font-display">
                  {path.focus}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Roadmap progress</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {totals.done}/{totals.total} milestones · {totals.doneHours}/{totals.hours}h
                  </span>
                </div>
                <Progress value={totals.pct} className="h-2" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> At a glance
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Weeks" value={String(weeks.length)} />
                <Stat label="Projects" value={String(projects.length)} />
                <Stat label="Skills tracked" value={String(heatmap.length)} />
                <Stat label="Completion" value={`${totals.pct}%`} />
              </CardContent>
            </Card>
          </div>

          {/* Skill heatmap */}
          <SectionCard
            title="Skill heatmap"
            description="Current vs target proficiency. Larger gaps with high market demand are prioritised."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {heatmap.map((h) => {
                const gap = Math.max(0, h.target - h.current);
                return (
                  <div
                    key={h.skill}
                    className="rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{h.skill}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wide ${
                          PRIORITY_STYLES[h.gap_priority]
                        }`}
                      >
                        {h.gap_priority}
                      </Badge>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/40"
                        style={{ width: `${h.target}%` }}
                      />
                      <div
                        className={`absolute inset-y-0 left-0 ${heatmapColor(gap)}`}
                        style={{ width: `${h.current}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground font-mono">
                      <span>now {h.current}</span>
                      <span>demand: {h.demand}</span>
                      <span>target {h.target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Weekly timeline */}
          <SectionCard
            title="Weekly roadmap"
            description="Each week unblocks the next. Click an item to cycle pending → in progress → done."
          >
            <div className="space-y-3">
              {weeks.map((w) => {
                const open = openWeeks[w.week] ?? false;
                const weekDone = w.items.filter((i) => progress[i.key] === "done").length;
                const weekPct = Math.round((weekDone / w.items.length) * 100);
                return (
                  <div key={w.week} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setOpenWeeks({ ...openWeeks, [w.week]: !open })}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="shrink-0 mt-0.5 h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono text-sm font-semibold">
                        W{w.week}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{w.theme}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {weekDone}/{w.items.length}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{w.outcome}</p>
                        <Progress value={weekPct} className="h-1.5 mt-2" />
                      </div>
                      {open ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground mt-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="border-t border-border bg-muted/20"
                        >
                          {w.items.map((it) => {
                            const status = progress[it.key] ?? "pending";
                            const Icon = TYPE_ICON[it.type] ?? BookOpen;
                            return (
                              <li
                                key={it.key}
                                className="flex items-start gap-3 p-3 border-b border-border/50 last:border-b-0"
                              >
                                <button
                                  onClick={() => cycleStatus(it)}
                                  className="mt-0.5 shrink-0"
                                  aria-label={`Cycle status for ${it.title}`}
                                >
                                  {status === "done" ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                  ) : status === "in_progress" ? (
                                    <Loader2 className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <Icon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-sm font-medium ${
                                        status === "done" ? "line-through text-muted-foreground" : ""
                                      }`}
                                    >
                                      {it.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] uppercase ${PRIORITY_STYLES[it.priority]}`}
                                    >
                                      {it.priority}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] uppercase">
                                      {it.type}
                                    </Badge>
                                    <span className="text-[11px] font-mono text-muted-foreground ml-auto">
                                      {it.est_hours}h
                                    </span>
                                  </div>
                                  {it.resource_url && (
                                    <a
                                      href={it.resource_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block mt-1 text-xs text-primary hover:underline"
                                    >
                                      Open resource →
                                    </a>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Projects */}
          <SectionCard
            title="Recommended portfolio projects"
            description="Recruiter-grade, role-aligned builds you can put on your resume."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((p) => (
                <Card key={p.title} className="rounded-xl border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{p.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {p.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.stack.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                      <span>{p.est_hours}h estimated</span>
                      <span className="text-right max-w-[60%]">{p.outcome}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}