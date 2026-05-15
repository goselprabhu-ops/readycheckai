// Lightweight, privacy-respecting client error reporter.
// No third-party SDK — posts unhandled errors / promise rejections
// to /api/public/client-errors, which validates and writes to
// public.system_events (source='client-error'). Idempotent: registers once.

let started = false;
let lastSig = "";
let lastTs = 0;

type Payload = {
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  route?: string;
  userAgent?: string;
  kind: "error" | "unhandledrejection";
};

function post(payload: Payload) {
  try {
    // De-dupe identical errors fired in a tight loop.
    const sig = `${payload.kind}:${payload.message}`;
    const now = Date.now();
    if (sig === lastSig && now - lastTs < 2000) return;
    lastSig = sig;
    lastTs = now;

    const body = JSON.stringify(payload);
    const url = "/api/public/client-errors";
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    void fetch(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never let telemetry break the page */
  }
}

function trim(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

export function startErrorReporter() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("error", (event) => {
    post({
      kind: "error",
      message: trim(event.message ?? "unknown error", 500) ?? "unknown error",
      stack: trim(event.error?.stack, 4000),
      source: trim(event.filename, 256),
      lineno: event.lineno,
      colno: event.colno,
      route: window.location.pathname,
      userAgent: trim(navigator.userAgent, 256),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as unknown;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "unhandled promise rejection";
    const stack = reason instanceof Error ? reason.stack : undefined;
    post({
      kind: "unhandledrejection",
      message: trim(message, 500) ?? "unhandled promise rejection",
      stack: trim(stack, 4000),
      route: window.location.pathname,
      userAgent: trim(navigator.userAgent, 256),
    });
  });
}
