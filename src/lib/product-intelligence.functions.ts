import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ProductIntelligence {
  window_days: number;
  computed_at: string;
  funnel: {
    signups: number;
    onboarded: number;
    resumed: number;
    assessed: number;
    interviewed: number;
    upgraded: number;
  };
  feature_heatmap: Array<{ event_name: string; total: number; unique_users: number }>;
  daily_active: Array<{ d: string; dau: number }>;
  cohorts: Array<{
    cohort_week: string;
    users: number;
    d1_count: number;
    d7_count: number;
    d30_count: number;
  }>;
  engagement: {
    events_24h: number;
    events_window: number;
    dau: number;
    wau: number;
    mau: number;
    sessions_24h: number;
  };
  top_routes: Array<{ route: string; views: number; users: number }>;
  dropoff_pages: Array<{ route: string; exits: number }>;
}

export const getProductIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ days: z.number().int().min(1).max(180).default(30) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await (supabase as any).rpc("product_intelligence", {
      _days: data.days,
    });
    if (error) throw new Error(error.message);
    return result as ProductIntelligence;
  });
