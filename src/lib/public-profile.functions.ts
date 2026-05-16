import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const settingsSchema = z.object({
  slug: z.string().regex(slugRegex, "Use 3-40 lowercase letters, digits, or dashes").optional().nullable(),
  is_public: z.boolean().optional(),
  show_readiness: z.boolean().optional(),
  show_skills: z.boolean().optional(),
  show_projects: z.boolean().optional(),
  show_certifications: z.boolean().optional(),
  show_achievements: z.boolean().optional(),
  show_experience: z.boolean().optional(),
  show_education: z.boolean().optional(),
  show_badges: z.boolean().optional(),
  show_contact: z.boolean().optional(),
  tagline: z.string().max(160).optional().nullable(),
  theme: z.enum(["default", "minimal", "bold"]).optional(),
});

export type PublicProfileSettings = z.infer<typeof settingsSchema>;

export const getMyPublicProfileSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("public_profile_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { settings: data };
  });

export const updateMyPublicProfileSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload: Record<string, unknown> = { user_id: userId };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) payload[k] = v;
    }
    if (typeof payload.slug === "string") {
      payload.slug = (payload.slug as string).toLowerCase().trim();
    }
    const { data: row, error } = await supabase
      .from("public_profile_settings")
      .upsert(payload as any, { onConflict: "user_id" })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error("That URL is already taken — pick another.");
      }
      throw new Error(error.message);
    }
    return { settings: row };
  });

export const getMyBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [defs, mine] = await Promise.all([
      supabase.from("badge_definitions").select("*").order("category"),
      supabase.from("user_badges").select("*").eq("user_id", userId),
    ]);
    if (defs.error) throw new Error(defs.error.message);
    if (mine.error) throw new Error(mine.error.message);
    const owned = new Set((mine.data ?? []).map((b) => b.badge_key));
    return {
      definitions: defs.data ?? [],
      owned: mine.data ?? [],
      ownedKeys: Array.from(owned),
    };
  });

// Recompute badges by inspecting user's data (assessments, interviews, resume, composite, learning paths, roles)
export const recomputeMyBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const earned: { key: string; evidence: Record<string, unknown> }[] = [];

    // Assessments — topic best %
    const { data: attempts } = await supabase
      .from("assessment_attempts")
      .select("id,total_score,max_score,assessment_id,completed_at,status")
      .eq("user_id", userId)
      .in("status", ["submitted", "expired"]);

    if (attempts && attempts.length > 0) {
      if (attempts.length >= 5) earned.push({ key: "consistent", evidence: { count: attempts.length } });

      // Build best % per assessment category via join
      const { data: defs } = await supabase
        .from("assessment_definitions")
        .select("id,category");
      const catById = new Map((defs ?? []).map((d) => [d.id, String(d.category).toLowerCase()]));
      const bestByTopic = new Map<string, number>();
      for (const a of attempts) {
        const max = a.max_score ?? 0;
        if (!max) continue;
        const pct = ((a.total_score ?? 0) / max) * 100;
        const topic = catById.get(a.assessment_id) ?? "general";
        bestByTopic.set(topic, Math.max(bestByTopic.get(topic) ?? 0, pct));
      }
      const topicBadge: Record<string, { key: string; min: number }> = {
        sql: { key: "sql_expert", min: 85 },
        python: { key: "python_pro", min: 80 },
        visualization: { key: "viz_specialist", min: 80 },
        statistics: { key: "stats_ace", min: 80 },
      };
      for (const [topic, pct] of bestByTopic) {
        const rule = topicBadge[topic];
        if (rule && pct >= rule.min) earned.push({ key: rule.key, evidence: { topic, pct: Math.round(pct) } });
      }
    }

    // Interview overall
    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("overall_score,status")
      .eq("user_id", userId)
      .not("overall_score", "is", null)
      .order("overall_score", { ascending: false })
      .limit(1);
    if (sessions && sessions[0] && (sessions[0].overall_score ?? 0) >= 75) {
      earned.push({ key: "interview_ready", evidence: { score: sessions[0].overall_score } });
    }

    // Resume ATS
    const { data: ras } = await supabase
      .from("resume_analyses")
      .select("ats_score")
      .eq("user_id", userId)
      .order("ats_score", { ascending: false })
      .limit(1);
    if (ras && ras[0] && (ras[0].ats_score ?? 0) >= 80) {
      earned.push({ key: "resume_optimized", evidence: { score: ras[0].ats_score } });
    }

    // Composite (Top Performer)
    const { data: emp } = await supabase
      .from("employability_scores")
      .select("composite")
      .eq("user_id", userId)
      .order("computed_at", { ascending: false })
      .limit(1);
    if (emp && emp[0] && (emp[0].composite ?? 0) >= 85) {
      earned.push({ key: "top_performer", evidence: { score: emp[0].composite } });
    }

    // Learning items
    const { data: lpp } = await supabase
      .from("learning_path_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (lpp && lpp.length >= 5) {
      earned.push({ key: "fast_learner", evidence: { count: lpp.length } });
    }

    // Upsert (use admin to bypass RLS for this user only — already scoped above)
    if (earned.length > 0) {
      const rows = earned.map((e) => ({ user_id: userId, badge_key: e.key, evidence: e.evidence }));
      const { error } = await supabaseAdmin
        .from("user_badges")
        .upsert(rows, { onConflict: "user_id,badge_key", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }

    return { awarded: earned.map((e) => e.key) };
  });

// Public lookup — no auth middleware
export const getPublicProfile = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(50) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin.rpc("get_public_profile", {
      _slug: data.slug.toLowerCase(),
    });
    if (error) throw new Error(error.message);
    return { profile: row as Record<string, unknown> | null };
  });