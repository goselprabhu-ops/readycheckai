import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeRoleReadiness,
  profileFromRow,
  recommendForRole,
  type DimensionInputs,
  type RoleDefinition,
} from "./role-readiness";

const V1_SLUGS = [
  "data-analyst",
  "business-analyst",
  "bi-analyst",
  "jr-data-scientist",
] as const;

function pct(score: number | null | undefined, total: number | null | undefined) {
  if (!score || !total) return 0;
  return Math.max(0, Math.min(100, Math.round((score / total) * 100)));
}

// Map an assessment topic / category string to one of the 6 dimensions.
function topicToDimension(topic: string | null | undefined): keyof DimensionInputs | null {
  const t = (topic ?? "").toLowerCase();
  if (!t) return null;
  if (/(sql|query|join|database)/.test(t)) return "sql";
  if (/(python|pandas|numpy)/.test(t)) return "python";
  if (/(stat|probabilit|hypothesis|distribution)/.test(t)) return "statistics";
  if (/(viz|visual|dashboard|power\s?bi|tableau|excel)/.test(t)) return "visualization";
  if (/(communicat|behavior|behavioural)/.test(t)) return "communication";
  if (/(business|case|analytics\s?case|product)/.test(t)) return "business";
  return null;
}

async function buildDimensionInputs(supabase: any): Promise<DimensionInputs> {
  const inputs: DimensionInputs = {
    sql: 0,
    python: 0,
    statistics: 0,
    visualization: 0,
    communication: 0,
    business: 0,
  };
  const samples: Record<keyof DimensionInputs, number[]> = {
    sql: [],
    python: [],
    statistics: [],
    visualization: [],
    communication: [],
    business: [],
  };

  // 1) Assessment topic scores
  const { data: assessments } = await supabase
    .from("assessments")
    .select("topic, score, total, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  for (const a of (assessments ?? []) as any[]) {
    const dim = topicToDimension(a.topic);
    if (!dim) continue;
    samples[dim].push(pct(a.score, a.total));
  }

  // 2) Interview sessions for communication & confidence
  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("communication_score, confidence_score, technical_score, category, overall_score, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  for (const s of (sessions ?? []) as any[]) {
    if (s.communication_score) samples.communication.push(s.communication_score);
    if (s.confidence_score) samples.communication.push(s.confidence_score);
    const dim = topicToDimension(s.category);
    if (dim && s.technical_score) samples[dim].push(s.technical_score);
  }

  // 3) Resume → visualization & business proxy (ATS score and keywords)
  const { data: ra } = await supabase
    .from("resume_analyses")
    .select("ats_score, keywords, parsed_fields, created_at")
    .order("created_at", { ascending: false })
    .limit(3);
  const latestResume = (ra ?? [])[0] as any;
  if (latestResume) {
    const ats = Number(latestResume.ats_score) || 0;
    // Resume contributes a soft baseline to business + visualization
    samples.business.push(ats);
    samples.visualization.push(ats);
  }

  // 4) Skill table → direct named skills
  const { data: skills } = await supabase
    .from("skills")
    .select("name, level")
    .order("updated_at", { ascending: false })
    .limit(60);
  for (const sk of (skills ?? []) as any[]) {
    const dim = topicToDimension(sk.name);
    if (!dim) continue;
    // Normalize level (0-5 or 0-10 → 0-100)
    const lvl = Number(sk.level) || 0;
    const normalized = lvl <= 5 ? lvl * 20 : lvl <= 10 ? lvl * 10 : Math.min(100, lvl);
    samples[dim].push(normalized);
  }

  // Average per dimension
  (Object.keys(samples) as (keyof DimensionInputs)[]).forEach((d) => {
    const arr = samples[d];
    if (arr.length === 0) {
      inputs[d] = 0;
      return;
    }
    inputs[d] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });
  return inputs;
}

async function loadRoles(supabase: any): Promise<RoleDefinition[]> {
  const { data, error } = await supabase
    .from("target_roles")
    .select("slug, name, description, dimension_weights, pathway, is_active")
    .in("slug", V1_SLUGS as unknown as string[])
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(profileFromRow);
}

export const getRoleReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ roleSlug: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await loadRoles(supabase);
    if (roles.length === 0) {
      return { primary: null, all: [], recommendations: [], inputs: null };
    }
    let primarySlug = data.roleSlug;
    if (!primarySlug) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_role")
        .eq("id", userId)
        .maybeSingle();
      primarySlug = (profile as any)?.target_role ?? roles[0].slug;
    }
    const inputs = await buildDimensionInputs(supabase);
    const all = roles.map((r) => computeRoleReadiness(inputs, r));
    const primary =
      all.find((r) => r.role.slug === primarySlug) ?? all[0];
    return {
      primary,
      all,
      recommendations: recommendForRole(primary, 6),
      inputs,
    };
  });

export const compareRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        roleSlugs: z.array(z.string()).min(1).max(4).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const roles = await loadRoles(supabase);
    const selected = data.roleSlugs?.length
      ? roles.filter((r) => data.roleSlugs!.includes(r.slug))
      : roles;
    const inputs = await buildDimensionInputs(supabase);
    return {
      inputs,
      results: selected.map((r) => computeRoleReadiness(inputs, r)),
    };
  });

export const listV1Roles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await loadRoles(context.supabase);
    return roles.map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      dimensionWeights: r.dimensionWeights,
      pathway: r.pathway,
    }));
  });