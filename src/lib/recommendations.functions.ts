import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateRuleRecommendations,
  type RecommendationDraft,
} from "./recommendations";

function topicLatest(
  attempts: { topic: string; score: number; total: number }[],
  needle: string,
) {
  const a = attempts.find((x) => x.topic.toLowerCase().includes(needle));
  if (!a || !a.total) return 0;
  return Math.round((a.score / a.total) * 100);
}

export const regenerateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [attemptsRes, resumeRes, skillsRes] = await Promise.all([
      supabase
        .from("assessments")
        .select("topic, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("resume_analyses")
        .select("ats_score, keywords, strengths, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("skills").select("name"),
    ]);

    const attempts = attemptsRes.data ?? [];
    const sqlScore = topicLatest(attempts as any, "sql");
    const pythonScore = topicLatest(attempts as any, "python");
    const resumeScore = (resumeRes.data?.ats_score ?? 0) as number;

    const skillNames = new Set<string>();
    for (const s of (skillsRes.data ?? []) as { name: string }[]) {
      if (s?.name) skillNames.add(s.name.toLowerCase());
    }
    const kw = (resumeRes.data?.keywords ?? []) as unknown[];
    for (const k of kw) {
      if (typeof k === "string") skillNames.add(k.toLowerCase());
    }

    // Heuristic project counter from resume strengths.
    const strengths = (resumeRes.data?.strengths ?? []) as unknown[];
    const projectsCount = strengths.filter(
      (s) => typeof s === "string" && /project/i.test(s as string),
    ).length;

    const drafts: RecommendationDraft[] = generateRuleRecommendations({
      sqlScore,
      pythonScore,
      resumeScore,
      skills: Array.from(skillNames),
      projectsCount,
    });

    // Upsert by (user_id, rule_key) so we don't duplicate; preserve completion status.
    if (drafts.length === 0) {
      return { count: 0, drafts: [] as RecommendationDraft[] };
    }

    const allowed = new Set(["sql", "python", "resume"]);
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const rows = drafts.map((d) => ({
      user_id: userId,
      rule_key: d.rule_key,
      title: d.title,
      description: d.description,
      category: (allowed.has(d.category) ? d.category : null) as
        | "sql"
        | "python"
        | "resume"
        | null,
      priority: d.priority,
      resource_url: d.resource_url ?? null,
      source: d.source,
      status: "pending" as const,
      generated_at: nowIso,
      expires_at: expiresIso,
    }));

    const { error } = await supabase
      .from("recommendations")
      .upsert(rows, { onConflict: "user_id,rule_key", ignoreDuplicates: false });
    if (error) throw new Error(error.message);

    // Expire stale recommendations: drop pending recs older than 30 days
    // that the rules engine no longer regenerates this run.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const keep = rows.map((r) => r.rule_key);
    await supabase
      .from("recommendations")
      .delete()
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .not("rule_key", "in", `(${keep.map((k) => `"${k}"`).join(",")})`);

    return { count: drafts.length, drafts };
  });