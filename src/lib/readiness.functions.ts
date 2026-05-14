import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeReadiness, DEFAULT_WEIGHTS, type ReadinessWeights } from "./readiness";

const WeightsSchema = z
  .object({
    sql: z.number().min(0).max(10),
    python: z.number().min(0).max(10),
    resume: z.number().min(0).max(10),
  })
  .optional();

function pct(score: number, total: number) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export const recomputeReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ weights: WeightsSchema }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const weights: ReadinessWeights = data.weights ?? DEFAULT_WEIGHTS;

    const [{ data: attempts }, { data: ra }] = await Promise.all([
      supabase
        .from("assessments")
        .select("topic, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("resume_analyses")
        .select("ats_score, created_at")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const latestByTopic = (key: string): { score: number; at: string | null } => {
      const a = (attempts ?? []).find((x: any) =>
        (x.topic ?? "").toLowerCase().includes(key),
      );
      return a ? { score: pct(a.score, a.total), at: a.created_at ?? null } : { score: 0, at: null };
    };

    const sqlSig = latestByTopic("sql");
    const pythonSig = latestByTopic("python");
    const resumeRow = ra?.[0] as any;
    const resumeScore = resumeRow?.ats_score ?? 0;
    const resumeAt = resumeRow?.created_at ?? null;

    const result = computeReadiness(
      {
        sql: sqlSig.score,
        python: pythonSig.score,
        resume: resumeScore,
        sqlAt: sqlSig.at,
        pythonAt: pythonSig.at,
        resumeAt: resumeAt,
      },
      weights,
    );

    const { data: row, error } = await supabase
      .from("readiness_history")
      .insert({
        user_id: userId,
        sql_score: result.sql,
        python_score: result.python,
        resume_score: result.resume,
        readiness: result.readiness,
        level: result.level,
        weights: result.weights,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return { ...result, id: (row as any).id, computed_at: (row as any).computed_at };
  });
