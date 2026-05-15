import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "@/lib/motion";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { regenerateRecommendations } from "@/lib/recommendations.functions";

interface Recommendation {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: number;
  resource_url: string | null;
  status: string;
  source: string;
  rule_key: string | null;
  created_at: string;
}

const priorityMeta = (p: number) => {
  if (p <= 1)
    return {
      label: "High priority",
      className:
        "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    };
  if (p === 2)
    return {
      label: "Medium",
      className:
        "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    };
  return {
    label: "Low",
    className:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  };
};

export function RecommendationsPanel() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const regenerate = useServerFn(regenerateRecommendations);

  const load = async () => {
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .order("status", { ascending: true })
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setItems((data ?? []) as Recommendation[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onRegenerate = async () => {
    setRefreshing(true);
    try {
      const res = await regenerate();
      toast.success(
        res.count > 0
          ? `Generated ${res.count} recommendation${res.count === 1 ? "" : "s"}`
          : "You're all caught up — no new recommendations",
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setRefreshing(false);
    }
  };

  const toggle = async (rec: Recommendation) => {
    const next = rec.status === "completed" ? "pending" : "completed";
    // Optimistic
    setItems((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, status: next } : r)),
    );
    const { error } = await supabase
      .from("recommendations")
      .update({ status: next })
      .eq("id", rec.id);
    if (error) {
      toast.error(error.message);
      setItems((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, status: rec.status } : r)),
      );
    } else if (next === "completed") {
      toast.success("Nice — marked complete");
    }
  };

  const { completed, total, percent } = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === "completed").length;
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [items]);

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 backdrop-blur-md shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Personalized recommendations
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Rule-based today · pluggable for AI suggestions
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={refreshing}
          className="rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Generating…" : "Regenerate"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Checklist progress</span>
            <span className="font-mono text-xs text-muted-foreground">
              {completed}/{total} · {percent}%
            </span>
          </div>
          <Progress value={percent} className="h-2 mt-2" />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No recommendations yet. Take an assessment or upload your resume,
              then click Regenerate.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((r) => {
                const meta = priorityMeta(r.priority);
                const done = r.status === "completed";
                return (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`group rounded-xl border p-3 transition-colors ${
                      done
                        ? "border-border/50 bg-muted/40"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggle(r)}
                        aria-label={done ? "Mark incomplete" : "Mark complete"}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-medium text-sm ${
                              done ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {r.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-wide ${meta.className}`}
                          >
                            {meta.label}
                          </Badge>
                          {r.category && (
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {r.category}
                            </Badge>
                          )}
                        </div>
                        {r.description && (
                          <p
                            className={`text-xs mt-1 ${
                              done ? "text-muted-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {r.description}
                          </p>
                        )}
                        {r.resource_url && !done && (
                          <a
                            href={r.resource_url}
                            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                          >
                            Take action
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}