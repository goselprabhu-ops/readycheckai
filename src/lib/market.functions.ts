import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SkillTrendPoint {
  month: string;
  demand_index: number;
  postings: number;
  growth_pct: number;
}
export interface SkillTrend {
  skill: string;
  category: string;
  latestIndex: number;
  avgGrowth: number;
  totalPostings: number;
  series: SkillTrendPoint[];
}

export interface RoleDemand {
  role_slug: string;
  role_name: string;
  latestOpenings: number;
  latestIndex: number;
  avgGrowth: number;
  series: { month: string; openings: number; demand_index: number }[];
}

export interface SalaryBand {
  role_slug: string;
  role_name: string;
  experience_level: string;
  currency: string;
  salary_min: number;
  salary_median: number;
  salary_max: number;
  sample_size: number;
}

export interface IndustryGrowth {
  industry: string;
  hiring_index: number;
  growth_pct: number;
  top_skill: string | null;
  month: string;
}

export const getMarketIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const [skillsRes, rolesRes, salaryRes, indRes] = await Promise.all([
      supabase
        .from("market_skills_trend")
        .select("skill, category, month, demand_index, postings, growth_pct")
        .order("month", { ascending: true }),
      supabase
        .from("market_role_demand")
        .select("role_slug, role_name, month, openings, demand_index, growth_pct")
        .eq("region", "global")
        .order("month", { ascending: true }),
      supabase
        .from("market_salary_bands")
        .select("*")
        .order("role_name", { ascending: true }),
      supabase
        .from("market_industry_growth")
        .select("industry, hiring_index, growth_pct, top_skill, month")
        .order("month", { ascending: false }),
    ]);

    // Aggregate skills
    const skillsMap = new Map<string, SkillTrend>();
    for (const row of (skillsRes.data ?? []) as any[]) {
      if (!skillsMap.has(row.skill)) {
        skillsMap.set(row.skill, {
          skill: row.skill,
          category: row.category,
          latestIndex: 0,
          avgGrowth: 0,
          totalPostings: 0,
          series: [],
        });
      }
      const s = skillsMap.get(row.skill)!;
      s.series.push({
        month: row.month,
        demand_index: row.demand_index,
        postings: row.postings,
        growth_pct: Number(row.growth_pct),
      });
    }
    for (const s of skillsMap.values()) {
      const last = s.series[s.series.length - 1];
      s.latestIndex = last?.demand_index ?? 0;
      s.avgGrowth =
        Math.round(
          (s.series.reduce((a, b) => a + b.growth_pct, 0) /
            Math.max(1, s.series.length)) *
            10,
        ) / 10;
      s.totalPostings = s.series.reduce((a, b) => a + b.postings, 0);
    }
    const skills = [...skillsMap.values()].sort(
      (a, b) => b.latestIndex - a.latestIndex,
    );

    // Aggregate roles
    const rolesMap = new Map<string, RoleDemand>();
    for (const row of (rolesRes.data ?? []) as any[]) {
      if (!rolesMap.has(row.role_slug)) {
        rolesMap.set(row.role_slug, {
          role_slug: row.role_slug,
          role_name: row.role_name,
          latestOpenings: 0,
          latestIndex: 0,
          avgGrowth: 0,
          series: [],
        });
      }
      const r = rolesMap.get(row.role_slug)!;
      r.series.push({
        month: row.month,
        openings: row.openings,
        demand_index: row.demand_index,
      });
      r.avgGrowth += Number(row.growth_pct);
    }
    for (const r of rolesMap.values()) {
      const last = r.series[r.series.length - 1];
      r.latestOpenings = last?.openings ?? 0;
      r.latestIndex = last?.demand_index ?? 0;
      r.avgGrowth =
        Math.round((r.avgGrowth / Math.max(1, r.series.length)) * 10) / 10;
    }
    const roles = [...rolesMap.values()].sort(
      (a, b) => b.latestIndex - a.latestIndex,
    );

    const salaries = (salaryRes.data ?? []) as SalaryBand[];
    const industries = ((indRes.data ?? []) as IndustryGrowth[]).reduce(
      (acc: Record<string, IndustryGrowth>, row) => {
        // Keep only latest month per industry
        if (!acc[row.industry]) acc[row.industry] = row;
        return acc;
      },
      {},
    );

    return {
      skills,
      roles,
      salaries,
      industries: Object.values(industries).sort(
        (a, b) => b.hiring_index - a.hiring_index,
      ),
    };
  });