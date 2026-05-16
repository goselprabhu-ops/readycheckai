import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rcl_session_id";

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface TrackOptions {
  role?: string | null;
  route?: string | null;
  properties?: Record<string, unknown>;
}

/**
 * Fire-and-forget product analytics. Failures are swallowed —
 * analytics must never break the app.
 */
export async function track(eventName: string, opts: TrackOptions = {}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const route =
      opts.route ?? (typeof window !== "undefined" ? window.location.pathname : null);
    await supabase.from("platform_events").insert({
      event_name: eventName,
      user_id: user?.id ?? null,
      role: opts.role ?? null,
      route,
      properties: (opts.properties ?? {}) as never,
      session_id: sessionId(),
    });
  } catch {
    // intentionally swallowed
  }
}
