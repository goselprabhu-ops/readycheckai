// Centralized security helpers for server functions.
// - logSecurityEvent: write to public.security_events via SECURITY DEFINER RPC
// - enforceCooldown: per-user, per-action sliding-window cooldown
// - CooldownError: typed error returned to clients as { code: 'cooldown', retry_after }
//
// Rate limiting: this project does not yet have backend primitives for
// IP-based or global request rate limiting. We use per-user quotas
// (ai_usage_daily, see ai-guardrails.ts) and per-action cooldowns instead.
// Both are enforced server-side and survive client tampering.

export type Severity = "info" | "warn" | "error" | "critical";

export class CooldownError extends Error {
  code = "cooldown" as const;
  constructor(public action: string, public retryAfter: number) {
    super(`Please wait ${retryAfter}s before retrying ${action}.`);
  }
}

/**
 * Best-effort audit log write. Never throws — security logging must not
 * break the underlying request flow.
 */
export async function logSecurityEvent(
  supabase: any,
  params: {
    eventType: string;
    severity?: Severity;
    metadata?: Record<string, unknown>;
    route?: string;
    ip?: string;
    userAgent?: string;
  },
): Promise<void> {
  try {
    await supabase.rpc("log_security_event", {
      _event_type: params.eventType,
      _severity: params.severity ?? "info",
      _metadata: params.metadata ?? {},
      _route: params.route ?? null,
      _ip: params.ip ?? null,
      _user_agent: params.userAgent ?? null,
    });
  } catch {
    // swallow — logging must not affect caller
  }
}

/**
 * Enforce per-user cooldown for a sensitive action. Throws CooldownError
 * if the user must wait. Otherwise records consumption and returns.
 *
 * Suggested cooldowns (seconds):
 *   resume_analysis:     30
 *   roadmap_generate:    60
 *   interview_message:    2
 *   assessment_submit:    5
 */
export async function enforceCooldown(
  supabase: any,
  action: string,
  cooldownSeconds: number,
): Promise<void> {
  const { data, error } = await supabase.rpc("check_action_cooldown", {
    _action: action,
    _cooldown_seconds: cooldownSeconds,
  });
  if (error) {
    // Fail-open on infra error; record a warn.
    await logSecurityEvent(supabase, {
      eventType: "cooldown_check_failed",
      severity: "warn",
      metadata: { action, error: error.message },
    });
    return;
  }
  const remaining = Number(data) || 0;
  if (remaining > 0) {
    await logSecurityEvent(supabase, {
      eventType: "cooldown_blocked",
      severity: "warn",
      metadata: { action, retry_after: remaining },
    });
    throw new CooldownError(action, remaining);
  }
}