import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ANALYTICS_ROLES, type AnalyticsRole } from "@/shared/types/roles";

const RoleSchema = z.object({
  role: z.enum(ANALYTICS_ROLES as unknown as [AnalyticsRole, ...AnalyticsRole[]]),
});

/** Topic keywords used to bucket assessment attempts per analytics role. */
const ROLE_TOPIC_KEYWORDS: Record<AnalyticsRole, string[]> = {
  data_analyst: ["sql", "python", "excel", "analytics", "data"],
  bi_analyst: ["power bi", "powerbi", "tableau", "dax", "dashboard", "sql"],
  business_analyst: ["business", "requirement", "stakeholder", "process", "excel", "sql"],
  jr_data_scientist: ["python", "statistic", "machine learning", "ml", "model", "regression"],
};

/** Skills emphasised per role for the skill-gap matrix. */
const ROLE_CORE_SKILLS: Record<AnalyticsRole, string[]> = {
  data_analyst: ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics"],
  bi_analyst: ["Power BI", "Tableau", "DAX", "SQL", "Data Modeling", "ETL"],
  business_analyst: ["SQL", "Excel", "Requirements", "Process Modeling", "Stakeholder", "Documentation"],
  jr_data_scientist: ["Python", "Statistics", "Machine Learning", "SQL", "Pandas", "Scikit-learn"],
};

function pct(score: number, total: number) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export interface RoleAnalytics {
  role: AnalyticsRole;
  match: number | null;
  ats: number;
  readiness: number;
  readinessLevel: string;
  attemptsCount: number;
  avgAttemptScore: number;
  bestAttemptScore: number;
  resumeAt: string | null;
  trend: { date: string; readiness: number; resume: number; skills: number }[];
  attempts: { id: string; topic: string; score: number; created_at: string }[];
  skillGap: { name: string; level: number; have: boolean }[];
  recommendations: { id: string; title: string; description: string | null; priority: number }[];
}

export const getRoleAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RoleSchema.parse(input))
  .handler(async ({ data, context }): Promise<RoleAnalytics> => {
    const { supabase, userId } = context;
    const role = data.role;
    const keywords = ROLE_TOPIC_KEYWORDS[role];

    const [
      { data: ra },
      { data: attemptsAll },
      { data: history },
      { data: skills },
      { data: recs },
    ] = await Promise.all([
      supabase
        .from("resume_analyses")
        .select("ats_score, role_matches, created_at")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("assessments")
        .select("id, topic, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("readiness_history")
        .select("readiness, resume_score, sql_score, python_score, level, computed_at")
        .order("computed_at", { ascending: true })
        .limit(20),
      supabase
        .from("skills")
        .select("name, level")
        .eq("user_id", userId)
        .order("level", { ascending: false })
        .limit(50),
      supabase
        .from("recommendations")
        .select("id, title, description, priority")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(5),
    ]);

    const resumeRow = (ra ?? [])[0] as { ats_score: number; role_matches: any; created_at: string } | undefined;
    const matchMap = (resumeRow?.role_matches ?? {}) as Record<string, number>;
    const match = typeof matchMap[role] === "number" ? Math.round(matchMap[role]) : null;

    const filtered = (attemptsAll ?? []).filter((a: any) => {
      const topic = (a.topic ?? "").toLowerCase();
      return keywords.some((k) => topic.includes(k));
    }) as Array<{ id: string; topic: string; score: number; total: number; created_at: string }>;

    const attemptScores = filtered.map((a) => pct(a.score, a.total));
    const avgAttemptScore = attemptScores.length
      ? Math.round(attemptScores.reduce((s, n) => s + n, 0) / attemptScores.length)
      : 0;
    const bestAttemptScore = attemptScores.length ? Math.max(...attemptScores) : 0;

    const latestHistory = (history ?? [])[history?.length ? history.length - 1 : 0] as
      | { readiness: number; level: string }
      | undefined;

    const trend = (history ?? []).map((h: any) => ({
      date: new Date(h.computed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      readiness: h.readiness ?? 0,
      resume: h.resume_score ?? 0,
      skills: Math.round(((h.sql_score ?? 0) + (h.python_score ?? 0)) / 2),
    }));

    const skillNames = new Map(
      (skills ?? []).map((s: any) => [String(s.name).toLowerCase(), s.level as number]),
    );
    const skillGap = ROLE_CORE_SKILLS[role].map((name) => {
      const level = skillNames.get(name.toLowerCase()) ?? 0;
      return { name, level, have: level >= 40 };
    });

    return {
      role,
      match,
      ats: resumeRow?.ats_score ?? 0,
      readiness: latestHistory?.readiness ?? 0,
      readinessLevel: latestHistory?.level ?? "Beginner",
      attemptsCount: filtered.length,
      avgAttemptScore,
      bestAttemptScore,
      resumeAt: resumeRow?.created_at ?? null,
      trend,
      attempts: filtered.slice(0, 8).map((a) => ({
        id: a.id,
        topic: a.topic,
        score: pct(a.score, a.total),
        created_at: a.created_at,
      })),
      skillGap,
      recommendations: (recs ?? []) as any,
    };
  });