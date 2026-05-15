import type { ReactNode } from "react";

/**
 * Wrap a chart with role="img" + a screen-reader-only summary so users
 * who can't see the chart still receive the trend information.
 */
export function AccessibleChart({
  label,
  summary,
  children,
}: {
  label: string;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <div role="img" aria-label={label} className="min-w-0">
      {summary && <span className="sr-only">{summary}</span>}
      {children}
    </div>
  );
}

export function summarizeSeries(name: string, values: number[]): string {
  if (!values.length) return `${name}: no data yet.`;
  const first = values[0];
  const last = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const delta = last - first;
  const trend =
    delta > 1 ? `up ${delta.toFixed(0)} points` : delta < -1 ? `down ${Math.abs(delta).toFixed(0)} points` : "roughly flat";
  return `${name}: ${values.length} points, latest ${last.toFixed(0)}, range ${min.toFixed(0)} to ${max.toFixed(0)}, trend ${trend}.`;
}