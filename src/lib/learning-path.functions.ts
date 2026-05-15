import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { chargeAiUsage } from "./ai-guardrails";
import { enforceCooldown } from "./security";

const ItemSchema = z.object({
  key: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  type: z.enum(["concept", "practice", "project", "reading", "assessment"]),
  est_hours: z.number().min(0.5).max(40),
  resource_url: z.string().url().nullable().optional(),
  priority: z.enum(["high", "medium", "low"]),
});

const WeekSchema = z.object({
  week: z.number().int().min(1).max(12),
  theme: z.string().min(1).max(120),
  outcome: z.string().min(1).max(240),
  items: z.array(ItemSchema).min(2).max(8),
});

const ProjectSchema = z.object({
  title: z.string().min(1).max(140),
  summary: z.string().min(1).max(400),
  stack: z.array(z.string().min(1).max(40)).min(1).max(10),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  est_hours: z.number().min(2).max(120),
  outcome: z.string().min(1).max(240),
});

const HeatmapSchema = z.object({
  skill: z.string().min(1).max(60),
  current: z.number().int().min(0).max(100),
  target: z.number().int().min(0).max(100),
  demand: z.enum(["low", "medium", "high"]),
  gap_priority: z.enum(["low", "medium", "high"]),
});

const PathSchema = z.object({
  focus: z.string().min(1).max(240),
  weeks: z.array(WeekSchema).min(2).max(8),
  skill_heatmap: z.array(HeatmapSchema).min(3).max(15),
  projects: z.array(ProjectSchema).min(1).max(5),
});

export type LearningPathPayload = z.infer<typeof PathSchema>;

function pct(score: number, total: number) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export const generateLearningPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      targetRole: z.string().min(1).max(120),
      weeks: z.number().int().min(2).max(8).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    await enforceCooldown(supabase, "learning_path_generate", 60);
    await chargeAiUsage(supabase, userId, "assessment_gen");

    const [skillsRes, attemptsRes, resumeRes, readinessRes, marketRes] =
      await Promise.all([
        supabase.from("skills").select("name, level").eq("user_id", userId),
        supabase
          .from("assessments")
          .select("topic, score, total, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("resume_analyses")
          .select("ats_score, role_matches, gaps, suggestions, parsed_fields, keywords, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("readiness_history")
          .select("readiness, level, sql_score, python_score, resume_score, computed_at")
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("market_demand_seed")
          .select("skill, role, demand_score")
          .order("demand_score", { ascending: false })
          .limit(40),
      ]);

    const skills = (skillsRes.data ?? []) as { name: string; level: number }[];
    const attempts = (attemptsRes.data ?? []) as {
      topic: string;
      score: number;
      total: number;
      created_at: string;
    }[];
    const attemptStats = attempts.map((a) => ({
      topic: a.topic,
      pct: pct(a.score, a.total),
      at: a.created_at,
    }));
    const resume = resumeRes.data ?? null;
    const readiness = readinessRes.data ?? null;
    const market = (marketRes.data ?? []) as {
      skill: string;
      role: string;
      demand_score: number;
    }[];

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const weeksRequested = data.weeks ?? 4;

    const prompt = `You are an AI career coach for analytics roles. Build a personalised, ${weeksRequested}-week learning roadmap for a user targeting "${data.targetRole}".

USER CONTEXT (JSON):
- skills (name, level 0-100): ${JSON.stringify(skills)}
- recent assessment attempts (topic, pct 0-100): ${JSON.stringify(attemptStats)}
- resume snapshot: ${JSON.stringify({
      ats_score: resume?.ats_score ?? null,
      role_matches: resume?.role_matches ?? null,
      gaps: resume?.gaps ?? [],
      suggestions: resume?.suggestions ?? [],
      keywords: resume?.keywords ?? [],
    })}
- readiness: ${JSON.stringify(readiness)}
- market demand seed (skill, role, demand 0-100): ${JSON.stringify(market.slice(0, 20))}

REQUIREMENTS:
1. Identify weakest skills and missing high-demand tools first. Prioritise improvements with the largest gap × demand score.
2. Build ${weeksRequested} weekly milestones. Earlier weeks unblock later weeks. Each week has 2-6 actionable items: concepts, practice, projects, readings, or assessments.
3. Each week must have a clear theme + measurable outcome (e.g. "Ship a SQL window-function notebook").
4. Generate a skill_heatmap of 6-12 entries scoring current vs target proficiency, market demand, and gap priority.
5. Recommend 2-3 portfolio projects tailored to the role (e.g. "Customer Churn Dashboard using SQL + Power BI"). Include stack, difficulty, est_hours, and the recruiter-visible outcome.
6. Use realistic resource URLs only when known; otherwise null.
7. Keep titles concise. No marketing fluff. No prose outside the JSON.

Return ONLY the JSON object matching the schema.`;

    let output: LearningPathPayload;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: PathSchema }),
        prompt,
      });
      output = res.output;
    } catch (err: any) {
      const raw = err?.text ?? err?.response?.text ?? "";
      const match = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null;
      if (!match) throw new Error("AI returned an unparseable roadmap. Please try again.");
      try {
        output = PathSchema.parse(JSON.parse(match[0]));
      } catch {
        throw new Error("AI returned an invalid roadmap. Please try again.");
      }
    }

    // Archive previous active paths
    await supabase
      .from("learning_paths")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .eq("status", "active");

    const { data: inserted, error } = await supabase
      .from("learning_paths")
      .insert({
        user_id: userId,
        target_role: data.targetRole,
        focus: output.focus,
        weeks: output.weeks as any,
        skill_heatmap: output.skill_heatmap as any,
        projects: output.projects as any,
        inputs_snapshot: {
          skills,
          attempts: attemptStats,
          resume_ats: resume?.ats_score ?? null,
          readiness: readiness?.readiness ?? null,
        } as any,
        status: "active",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { path: inserted };
  });

export const setLearningItemStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      pathId: z.string().uuid(),
      itemKey: z.string().min(1).max(80),
      status: z.enum(["pending", "in_progress", "done"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const completed_at = data.status === "done" ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("learning_path_progress")
      .upsert(
        {
          path_id: data.pathId,
          user_id: userId,
          item_key: data.itemKey,
          status: data.status,
          completed_at,
        },
        { onConflict: "path_id,item_key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getActiveLearningPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: path } = await supabase
      .from("learning_paths")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!path) return { path: null, progress: [] };
    const { data: progress } = await supabase
      .from("learning_path_progress")
      .select("item_key, status")
      .eq("path_id", path.id);
    return { path, progress: progress ?? [] };
  });