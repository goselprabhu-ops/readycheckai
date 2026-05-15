import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/shared/types/roles";

/**
 * Returns the current user's app roles from public.user_roles.
 * Empty array if the user has no role rows.
 */
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppRole[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("[getMyRoles]", error);
      return [];
    }
    return (data ?? []).map((row) => row.role as AppRole);
  });