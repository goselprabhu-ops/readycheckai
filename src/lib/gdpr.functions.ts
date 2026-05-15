import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logEvent } from "@/lib/observability";

/**
 * GDPR / DPDP-aligned data export. Returns every row the authenticated user
 * owns across the application, plus a manifest. The user-scoped supabase
 * client (from `requireSupabaseAuth`) means RLS naturally restricts the
 * result set to rows where `user_id = auth.uid()`.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const tables = [
      "profiles",
      "user_roles",
      "skills",
      "assessments",
      "assessment_attempts",
      "scores",
      "resumes",
      "resume_analyses",
      "employability_scores",
      "readiness_history",
      "recommendations",
      "roadmap_items",
      "interview_sessions",
      "interview_messages",
      "ai_usage_daily",
    ] as const;

    const out: Record<string, unknown> = {};
    for (const t of tables) {
      // `profiles` is keyed by `id`, everything else by `user_id`.
      const filterCol = t === "profiles" ? "id" : "user_id";
      const { data, error } = await supabase.from(t).select("*").eq(filterCol, userId);
      out[t] = error ? { error: error.message } : data ?? [];
    }

    await logEvent({
      eventType: "gdpr_export",
      severity: "info",
      source: "gdpr",
      message: "user exported their data",
      metadata: { user_id: userId },
    });

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      schema_version: 1,
      data: out,
    };
  });