import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { recomputeReadiness } from "@/lib/readiness.functions";
import {
  BENCHMARKS,
  LEVEL_COLOR,
  levelFor,
  type ReadinessLevel,
} from "@/lib/readiness";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface HistoryRow {
  id: string;
  sql_score: number;
  python_score: number;
  resume_score: number;
  readiness: number;
  level: ReadinessLevel;
  computed_at: string;
}

export function ReadinessPanel() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const recompute = useServerFn(recomputeReadiness);

  const load = async () => {
    const { data } = await supabase
      .from("readiness_history")
      .select("*")
      .order("computed_at", { ascending: true })
      .limit(30);
    setHistory((data ?? []) as HistoryRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const delta = latest && previous ? latest.readiness - previous.readiness : 0;

  const onRecompute = async () => {
    setRecomputing(true);
    try {
      await recompute({ data: {} });
      toast.success("Readiness recomputed");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setRecomputing(false);
    }
  };

  const chart = useMemo(
    () =>
      history.map((h, i) => ({
        idx: i + 1,
        date: new Date(h.computed_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        Readiness: h.readiness,
      })),
    [history],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Readiness score</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            (SQL + Python + Resume) / 3 — tracked over time
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRecompute}
          disabled={recomputing}
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          {recomputing ? "Computing…" : "Recompute"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        ) : !latest ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground mb-3">
              No readiness snapshots yet.
            </p>
            <Button onClick={onRecompute} disabled={recomputing}>
              <Sparkles className="h-4 w-4 mr-2" />
              Compute first score
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Circular readiness chart */}
            <div className="flex flex-col items-center justify-center">
              <ReadinessRing value={latest.readiness} level={latest.level} />
              <div className="mt-4 flex items-center gap-2">
                <Badge style={{ backgroundColor: LEVEL_COLOR[latest.level] }} className="text-white">
                  {latest.level}
                </Badge>
                <GrowthBadge delta={delta} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 w-full text-center">
                <SubScore label="SQL" value={latest.sql_score} />
                <SubScore label="Python" value={latest.python_score} />
                <SubScore label="Resume" value={latest.resume_score} />
              </div>
            </div>

            {/* Trend + benchmarks */}
            <div>
              <div className="h-48">
                <ResponsiveContainer>
                  <LineChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                    />
                    {BENCHMARKS.map((b) => (
                      <ReferenceLine
                        key={b.label}
                        y={b.score}
                        stroke={LEVEL_COLOR[b.level]}
                        strokeDasharray="4 4"
                        opacity={0.5}
                        label={{
                          value: b.label,
                          fill: "var(--muted-foreground)",
                          fontSize: 10,
                          position: "right",
                        }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="Readiness"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {BENCHMARKS.map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: LEVEL_COLOR[b.level] }}
                      />
                      <span className="text-muted-foreground">{b.label}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">{b.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReadinessRing({ value, level }: { value: number; level: ReadinessLevel }) {
  const size = 176;
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
          stroke="var(--muted)"
          strokeWidth={stroke}
          fill="none"
          opacity={0.3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-bold"
        >
          {value}
        </motion.span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card/50 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}

function GrowthBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> no change
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        up ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {delta} since last
    </span>
  );
}

// Re-export for callers that want to render without the panel chrome
export { levelFor };
