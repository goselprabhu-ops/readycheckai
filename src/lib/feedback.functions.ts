import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SURFACES = [
  "resume",
  "recommendation",
  "interview",
  "assessment",
  "roadmap",
  "other",
] as const;
export type FeedbackSurface = (typeof SURFACES)[number];

const submitSchema = z.object({
  surface: z.enum(SURFACES),
  rating: z.union([z.literal(1), z.literal(-1)]),
  entityId: z.string().trim().max(128).optional().nullable(),
  qualityScore: z.number().int().min(1).max(5).optional().nullable(),
  issueTag: z.string().trim().max(64).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
  feature: z.string().trim().max(64).optional().nullable(),
  model: z.string().trim().max(128).optional().nullable(),
  context: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * Submit a single feedback signal. Safe to call repeatedly — analytics
 * aggregations are designed to handle multiple datapoints per entity.
 */
export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("ai_feedback").insert({
      user_id: userId,
      surface: data.surface,
      rating: data.rating,
      entity_id: data.entityId ?? null,
      quality_score: data.qualityScore ?? null,
      issue_tag: data.issueTag ?? null,
      comment: data.comment ?? null,
      feature: data.feature ?? null,
      model: data.model ?? null,
      context: (data.context ?? {}) as never,
    });
    if (error) {
      console.error("[submitFeedback]", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

const windowSchema = z.object({ days: z.number().int().min(1).max(180).default(30) });

export interface FeedbackOverview {
  window_days: number;
  generated_at: string;
  by_surface: { surface: string; total: number; up: number; down: number; avg_quality: number | null }[];
  top_issues: { surface: string; issue_tag: string; count: number }[];
  recent_comments: {
    id: string;
    surface: string;
    rating: number;
    issue_tag: string | null;
    comment: string;
    model: string | null;
    created_at: string;
  }[];
  trend: { day: string; surface: string; up: number; down: number }[];
}

export const getFeedbackOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => windowSchema.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<FeedbackOverview> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc("ai_feedback_overview" as never, {
      _days: data.days,
    } as never);
    if (error) throw new Error(error.message);
    return rows as unknown as FeedbackOverview;
  });

export interface RecommendationAccuracy {
  window_days: number;
  generated_at: string;
  by_source: { source: string; total: number; accepted: number; dismissed: number }[];
  feedback_by_source: {
    source: string;
    feedback_total: number;
    feedback_up: number;
    feedback_down: number;
  }[];
}

export const getRecommendationAccuracy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => windowSchema.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<RecommendationAccuracy> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.rpc("recommendation_accuracy" as never, {
      _days: data.days,
    } as never);
    if (error) throw new Error(error.message);
    return rows as unknown as RecommendationAccuracy;
  });