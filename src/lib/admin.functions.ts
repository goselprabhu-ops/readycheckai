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

export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const [profiles, assessments, resumes, scores] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("assessments").select("id", { count: "exact", head: true }),
      supabase.from("resume_analyses").select("id", { count: "exact", head: true }),
      supabase.from("employability_scores").select("composite"),
    ]);

    // Method breakdown for resume analyses (ai vs deterministic fallback).
    const [aiCount, rulesCount] = await Promise.all([
      supabase
        .from("resume_analyses")
        .select("id", { count: "exact", head: true })
        .eq("method", "ai"),
      supabase
        .from("resume_analyses")
        .select("id", { count: "exact", head: true })
        .eq("method", "rules"),
    ]);

    const composites = (scores.data ?? []).map((r: any) => r.composite ?? 0);
    const avgComposite = composites.length
      ? Math.round(composites.reduce((a: number, b: number) => a + b, 0) / composites.length)
      : 0;

    return {
      totals: {
        users: profiles.count ?? 0,
        assessments: assessments.count ?? 0,
        resumes: resumes.count ?? 0,
        resumesAi: aiCount.count ?? 0,
        resumesRules: rulesCount.count ?? 0,
        avgComposite,
      },
    };
  });

export const listAdminResumeAnalyses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: rows, error } = await supabase
      .from("resume_analyses")
      .select("id, user_id, ats_score, method, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as any[] };
    const nameById = new Map<string, string>(
      (profiles ?? []).map((p: any) => [p.id, p.full_name ?? ""]),
    );

    return {
      analyses: (rows ?? []).map((r: any) => ({
        id: r.id as string,
        user_id: r.user_id as string,
        full_name: nameById.get(r.user_id) ?? null,
        ats_score: r.ats_score as number,
        method: (r.method ?? "ai") as "ai" | "rules",
        summary: r.summary as string | null,
        created_at: r.created_at as string,
      })),
    };
  });

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, headline, college, target_role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p: any) => p.id);
    const { data: roles } = ids.length
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", ids)
      : { data: [] as any[] };

    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    }

    return {
      users: (profiles ?? []).map((p: any) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
      })),
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      targetUserId: z.string().uuid(),
      role: z.enum(["student", "recruiter", "college_admin", "institute_admin", "gov_admin", "admin"]),
      grant: z.boolean(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    if (data.grant) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: data.targetUserId, role: data.role } as any);
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.targetUserId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });