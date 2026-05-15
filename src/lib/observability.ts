// Structured logging + system_events recorder.
// - logEvent: best-effort write to public.system_events (service role) AND
//   structured JSON to stdout (Logtail/Datadog/Cloudflare-compatible).
// - withTiming: wrap an async unit, emits latency_ms + error severity on throw.
//
// Server-only module: imports the admin client and must never reach the
// client bundle. Filename ends with `.ts` (not `.server.ts`) but it is only
// imported from server functions / server routes.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Severity = "info" | "warn" | "error" | "critical";

export interface LogEventInput {
  eventType: string;
  severity?: Severity;
  source?: string;
  route?: string;
  message?: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}

function emitStructured(input: LogEventInput) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level: input.severity ?? "info",
    event: input.eventType,
    source: input.source ?? null,
    route: input.route ?? null,
    message: input.message ?? null,
    latency_ms: input.latencyMs ?? null,
    ...(input.metadata ?? {}),
  });
  // eslint-disable-next-line no-console
  (input.severity === "error" || input.severity === "critical"
    ? console.error
    : input.severity === "warn"
    ? console.warn
    : console.log)(line);
}

export async function logEvent(input: LogEventInput): Promise<void> {
  emitStructured(input);
  try {
    await supabaseAdmin.rpc("log_system_event", {
      _event_type: input.eventType,
      _severity: input.severity ?? "info",
      _source: input.source ?? undefined,
      _route: input.route ?? undefined,
      _message: input.message ?? undefined,
      _latency_ms: input.latencyMs ?? undefined,
      _metadata: (input.metadata ?? {}) as never,
    });
  } catch {
    // never let logging break the caller
  }
}

/**
 * Wrap an async unit of work and record latency + outcome to system_events.
 */
export async function withTiming<T>(
  meta: { eventType: string; source?: string; route?: string; metadata?: Record<string, unknown> },
  fn: () => Promise<T>,
): Promise<T> {
  const t0 = Date.now();
  try {
    const out = await fn();
    const latencyMs = Date.now() - t0;
    // Only log slow ops at info level to avoid noise (>2s).
    if (latencyMs > 2000) {
      await logEvent({
        eventType: meta.eventType,
        severity: "warn",
        source: meta.source,
        route: meta.route,
        message: "slow_op",
        latencyMs,
        metadata: meta.metadata,
      });
    }
    return out;
  } catch (err) {
    await logEvent({
      eventType: meta.eventType,
      severity: "error",
      source: meta.source,
      route: meta.route,
      message: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - t0,
      metadata: meta.metadata,
    });
    throw err;
  }
}