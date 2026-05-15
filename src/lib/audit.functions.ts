import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Admin-only audit log viewer. Surfaces recent rows from `system_events`
 * and `security_events` so operators can investigate without going to the
 * database directly. RLS already restricts these tables to admins, but we
 * also re-check the role here for defense in depth.
 */
export const listAuditEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: z.enum(["system", "security", "all"]).default("all"),
        severity: z.enum(["info", "warn", "error", "critical", "any"]).default("any"),
        search: z.string().trim().max(200).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // role check (defense in depth on top of RLS)
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const wantSystem = data.kind === "system" || data.kind === "all";
    const wantSecurity = data.kind === "security" || data.kind === "all";

    const sysQ = supabaseAdmin
      .from("system_events")
      .select("id, created_at, event_type, severity, source, route, message, metadata")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    const secQ = supabaseAdmin
      .from("security_events")
      .select("id, created_at, event_type, severity, route, user_id, ip_address, metadata")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.severity !== "any") {
      sysQ.eq("severity", data.severity);
      secQ.eq("severity", data.severity);
    }
    if (data.search) {
      sysQ.ilike("event_type", `%${data.search}%`);
      secQ.ilike("event_type", `%${data.search}%`);
    }

    const [sys, sec] = await Promise.all([
      wantSystem ? sysQ : Promise.resolve({ data: [] as any[], error: null }),
      wantSecurity ? secQ : Promise.resolve({ data: [] as any[], error: null }),
    ]);
    if ((sys as any).error) throw new Error((sys as any).error.message);
    if ((sec as any).error) throw new Error((sec as any).error.message);

    return {
      system: ((sys.data ?? []) as any[]).map((r) => ({
        kind: "system" as const,
        id: r.id,
        created_at: r.created_at,
        event_type: r.event_type,
        severity: r.severity,
        source: r.source ?? null,
        route: r.route ?? null,
        message: r.message ?? null,
        metadata: r.metadata ?? null,
      })),
      security: ((sec.data ?? []) as any[]).map((r) => ({
        kind: "security" as const,
        id: r.id,
        created_at: r.created_at,
        event_type: r.event_type,
        severity: r.severity,
        route: r.route ?? null,
        user_id: r.user_id ?? null,
        ip_address: r.ip_address ?? null,
        metadata: r.metadata ?? null,
      })),
    };
  });