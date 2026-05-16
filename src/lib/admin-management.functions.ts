import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

/* ----------------------------- Assessments ------------------------------ */

export const listAssessmentDefinitions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await (supabase as any)
      .from("assessment_definitions")
      .select("id, title, description, category, role_id, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const upsertAssessmentDefinition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional().nullable(),
      category: z.string().min(1).max(50),
      role_id: z.string().uuid().optional().nullable(),
      is_active: z.boolean().default(true),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const payload: any = {
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      role_id: data.role_id ?? null,
      is_active: data.is_active,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await (supabase as any)
      .from("assessment_definitions")
      .upsert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

export const toggleAssessmentDefinition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await (supabase as any)
      .from("assessment_definitions")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------ Questions ------------------------------- */

export const listQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      assessmentId: z.string().uuid().optional(),
      search: z.string().max(200).optional(),
      limit: z.number().min(1).max(200).default(100),
    }).parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    let q = (supabase as any)
      .from("questions")
      .select("id, assessment_id, prompt, topic, difficulty, points, options, order_index, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.assessmentId) q = q.eq("assessment_id", data.assessmentId);
    if (data.search) q = q.ilike("prompt", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  assessment_id: z.string().uuid(),
  prompt: z.string().min(3).max(2000),
  topic: z.string().max(80).optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  points: z.number().int().min(1).max(20).default(1),
  options: z.array(z.string().min(1).max(400)).min(2).max(8),
  order_index: z.number().int().min(0).default(0),
  correct_answer: z.string().min(1).max(400),
  explanation: z.string().max(2000).optional().nullable(),
});

export const upsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => questionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const payload: any = {
      assessment_id: data.assessment_id,
      prompt: data.prompt,
      topic: data.topic ?? null,
      difficulty: data.difficulty,
      points: data.points,
      options: data.options,
      order_index: data.order_index,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await (supabase as any)
      .from("questions")
      .upsert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const { error: sErr } = await (supabase as any)
      .from("question_secrets")
      .upsert({
        question_id: row.id,
        correct_answer: data.correct_answer,
        explanation: data.explanation ?? null,
      });
    if (sErr) throw new Error(sErr.message);
    return { item: row };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    await (supabase as any).from("question_secrets").delete().eq("question_id", data.id);
    const { error } = await (supabase as any).from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------- CSV upload ------------------------------- */

export const bulkImportQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      assessment_id: z.string().uuid(),
      rows: z.array(
        z.object({
          prompt: z.string().min(3).max(2000),
          topic: z.string().max(80).optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
          points: z.number().int().min(1).max(20).default(1),
          options: z.array(z.string().min(1).max(400)).min(2).max(8),
          correct_answer: z.string().min(1).max(400),
          explanation: z.string().max(2000).optional(),
        })
      ).min(1).max(500),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    let inserted = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const [i, r] of data.rows.entries()) {
      const { data: q, error } = await (supabase as any)
        .from("questions")
        .insert({
          assessment_id: data.assessment_id,
          prompt: r.prompt,
          topic: r.topic ?? null,
          difficulty: r.difficulty,
          points: r.points,
          options: r.options,
          order_index: i,
        })
        .select()
        .single();
      if (error || !q) { failed++; errors.push(`row ${i + 1}: ${error?.message ?? "insert failed"}`); continue; }
      const { error: sErr } = await (supabase as any)
        .from("question_secrets")
        .insert({ question_id: q.id, correct_answer: r.correct_answer, explanation: r.explanation ?? null });
      if (sErr) { failed++; errors.push(`row ${i + 1}: ${sErr.message}`); continue; }
      inserted++;
    }
    return { inserted, failed, errors: errors.slice(0, 20) };
  });

/* --------------------------- Role benchmarks ---------------------------- */

export const listRoleBenchmarks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await (supabase as any)
      .from("target_roles")
      .select("id, name, slug, description, dimension_weights, benchmark_ranges, skill_weights, pathway, is_active")
      .order("name");
    if (error) throw new Error(error.message);
    return { roles: data ?? [] };
  });

export const updateRoleBenchmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      dimension_weights: z.record(z.string(), z.number().min(0).max(1)).optional(),
      benchmark_ranges: z.record(z.string(), z.array(z.number())).optional(),
      is_active: z.boolean().optional(),
      description: z.string().max(1000).optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const update: any = {};
    if (data.dimension_weights) update.dimension_weights = data.dimension_weights;
    if (data.benchmark_ranges) update.benchmark_ranges = data.benchmark_ranges;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    if (data.description !== undefined) update.description = data.description;
    const { error } = await (supabase as any)
      .from("target_roles")
      .update(update)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------- Recommendation config ------------------------ */

export const listRecommendationOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: recent } = await (supabase as any)
      .from("recommendations")
      .select("id, user_id, title, category, priority, status, source, rule_key, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: agg } = await (supabase as any)
      .from("recommendations")
      .select("source, status, rule_key");
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byRule: Record<string, number> = {};
    for (const r of agg ?? []) {
      bySource[r.source ?? "rules"] = (bySource[r.source ?? "rules"] ?? 0) + 1;
      byStatus[r.status ?? "pending"] = (byStatus[r.status ?? "pending"] ?? 0) + 1;
      if (r.rule_key) byRule[r.rule_key] = (byRule[r.rule_key] ?? 0) + 1;
    }
    return { recent: recent ?? [], bySource, byStatus, byRule };
  });

/* --------------------------- Content moderation ------------------------- */

export const listContentFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ status: z.enum(["open", "in_review", "resolved", "dismissed", "all"]).default("open") }).parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    let q = (supabase as any)
      .from("content_flags")
      .select("id, reporter_id, entity_type, entity_id, entity_ref, reason, notes, status, resolution, resolved_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { flags: rows ?? [] };
  });

export const updateContentFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "in_review", "resolved", "dismissed"]),
      resolution: z.string().max(1000).optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const update: any = {
      status: data.status,
      resolution: data.resolution ?? null,
    };
    if (data.status === "resolved" || data.status === "dismissed") {
      update.resolved_by = userId;
      update.resolved_at = new Date().toISOString();
    }
    const { error } = await (supabase as any)
      .from("content_flags")
      .update(update)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------- Analytics -------------------------------- */

export const getPlatformAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [profiles, assessments, attempts, interviews, resumes, scores, ai] = await Promise.all([
      (supabase as any).from("profiles").select("created_at, target_role, college"),
      (supabase as any).from("assessments").select("created_at, topic, score"),
      (supabase as any).from("assessment_attempts").select("created_at, status, total_score, max_score").gte("created_at", since),
      (supabase as any).from("interview_sessions").select("created_at, status, overall_score, category").gte("created_at", since),
      (supabase as any).from("resume_analyses").select("created_at, ats_score, method").gte("created_at", since),
      (supabase as any).from("employability_scores").select("computed_at, composite, sql_score, python_score, resume_score"),
      (supabase as any).from("ai_usage_daily").select("day, feature, count").gte("day", since.slice(0, 10)),
    ]);

    // signups per day (last 30d)
    const byDay: Record<string, number> = {};
    for (const p of profiles.data ?? []) {
      const d = (p.created_at ?? "").slice(0, 10);
      if (!d) continue;
      if (d < since.slice(0, 10)) continue;
      byDay[d] = (byDay[d] ?? 0) + 1;
    }
    const signupSeries = Object.entries(byDay).sort().map(([day, count]) => ({ day, count }));

    // role distribution
    const roleDist: Record<string, number> = {};
    for (const p of profiles.data ?? []) {
      const r = p.target_role || "Unspecified";
      roleDist[r] = (roleDist[r] ?? 0) + 1;
    }

    // assessment topic averages
    const topicAgg: Record<string, { sum: number; n: number }> = {};
    for (const a of assessments.data ?? []) {
      const t = a.topic || "general";
      const cur = topicAgg[t] ?? { sum: 0, n: 0 };
      cur.sum += a.score ?? 0;
      cur.n += 1;
      topicAgg[t] = cur;
    }
    const topicAverages = Object.entries(topicAgg).map(([topic, v]) => ({ topic, avg: Math.round(v.sum / Math.max(v.n, 1)), count: v.n }));

    // interview avg
    const interviewScores = (interviews.data ?? []).map((i: any) => i.overall_score).filter((n: any) => typeof n === "number");
    const avgInterview = interviewScores.length
      ? Math.round(interviewScores.reduce((a: number, b: number) => a + b, 0) / interviewScores.length)
      : 0;

    // resume method split
    const resumeMethods: Record<string, number> = { ai: 0, rules: 0 };
    for (const r of resumes.data ?? []) resumeMethods[r.method ?? "ai"] = (resumeMethods[r.method ?? "ai"] ?? 0) + 1;

    // AI usage by feature
    const aiByFeature: Record<string, number> = {};
    for (const u of ai.data ?? []) aiByFeature[u.feature] = (aiByFeature[u.feature] ?? 0) + (u.count ?? 0);

    // composite avg
    const composites = (scores.data ?? []).map((r: any) => r.composite ?? 0);
    const avgComposite = composites.length ? Math.round(composites.reduce((a: number, b: number) => a + b, 0) / composites.length) : 0;

    return {
      totals: {
        users: (profiles.data ?? []).length,
        attempts_30d: (attempts.data ?? []).length,
        interviews_30d: (interviews.data ?? []).length,
        resumes_30d: (resumes.data ?? []).length,
        avgComposite,
        avgInterview,
      },
      signupSeries,
      roleDist,
      topicAverages,
      resumeMethods,
      aiByFeature,
    };
  });

export const getUserAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const [profile, attempts, interviews, resumes, score, skills] = await Promise.all([
      (supabase as any).from("profiles").select("id, full_name, target_role, college, created_at").eq("id", data.targetUserId).maybeSingle(),
      (supabase as any).from("assessment_attempts").select("created_at, status, total_score, max_score").eq("user_id", data.targetUserId).order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("interview_sessions").select("created_at, category, overall_score, status").eq("user_id", data.targetUserId).order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("resume_analyses").select("created_at, ats_score, method").eq("user_id", data.targetUserId).order("created_at", { ascending: false }).limit(10),
      (supabase as any).from("employability_scores").select("composite, market_fit, skills_score, resume_score, computed_at").eq("user_id", data.targetUserId).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      (supabase as any).from("skills").select("name, level").eq("user_id", data.targetUserId),
    ]);
    return {
      profile: profile.data,
      attempts: attempts.data ?? [],
      interviews: interviews.data ?? [],
      resumes: resumes.data ?? [],
      score: score.data,
      skills: skills.data ?? [],
    };
  });