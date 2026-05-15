// Browser-only Web Vitals beacon. Posts CLS / INP / LCP / FCP / TTFB
// to /api/public/web-vitals via sendBeacon (falls back to fetch+keepalive).
// Idempotency-safe: registers once per session.
import type { Metric } from "web-vitals";

let started = false;

function send(metric: Metric) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    const url = "/api/public/web-vitals";
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

export function startWebVitals() {
  if (started || typeof window === "undefined") return;
  started = true;
  // dynamic import keeps web-vitals out of the main bundle
  void import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    onCLS(send);
    onINP(send);
    onLCP(send);
    onFCP(send);
    onTTFB(send);
  }).catch(() => {});
}