import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeReadinessV2,
  DEFAULT_ROLE_PROFILE,
  profileFromRow,
  type RoleProfile,
} from "./readiness-engine";

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

    const [{ data: attempts }, { data: ra }, { data: profile }, { data: history }] = await Promise.all([
      supabase
        .from("assessments")
        .select("topic, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("resume_analyses")
        .select("ats_score, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("target_role")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("readiness_history")
        .select("readiness, computed_at")
        .order("computed_at", { ascending: false })
        .limit(5),
    ]);

    // Aggregate per-pillar signals (latest score, recency, sample count).
    const pillarSignal = (key: string) => {
      const matches = (attempts ?? []).filter((x: any) =>
        (x.topic ?? "").toLowerCase().includes(key),
      );
      const latest = matches[0] as any;
      return {
        score: latest ? pct(latest.score, latest.total) : 0,
        at: latest?.created_at ?? null,
        samples: matches.length,
      };
    };

    const resumeRows = (ra ?? []) as any[];
    const resumeSig = {
      score: resumeRows[0]?.ats_score ?? 0,
      at: resumeRows[0]?.created_at ?? null,
      samples: resumeRows.length,
    };

    // Resolve role profile (DB-backed, falls back to default Data Analyst).
    let roleProfile: RoleProfile = DEFAULT_ROLE_PROFILE;
    const targetSlug = (profile as any)?.target_role as string | null | undefined;
    if (targetSlug) {
      const { data: roleRow } = await supabase
        .from("target_roles")
        .select("slug, name, skill_weights, benchmark_ranges")
        .eq("slug", targetSlug)
        .maybeSingle();
      if (roleRow) roleProfile = profileFromRow(roleRow as any);
    }

    // Legacy override: caller can still pass raw weights.
    if (data.weights) {
      roleProfile = { ...roleProfile, weights: data.weights };
    }

    const result = computeReadinessV2(
      {
        sql: pillarSignal("sql"),
        python: pillarSignal("python"),
        resume: resumeSig,
        history: (history ?? []) as any,
      },
      roleProfile,
    );

    const { data: row, error } = await supabase
      .from("readiness_history")
      .insert({
        user_id: userId,
        sql_score: result.pillars.sql,
        python_score: result.pillars.python,
        resume_score: result.pillars.resume,
        readiness: result.readiness,
        level: result.level,
        weights: result.weights,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return { ...result, id: (row as any).id, computed_at: (row as any).computed_at };
  });
