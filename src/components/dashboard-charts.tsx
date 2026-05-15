// Lazy chart wrappers — Recharts (~80kb gz) is split into its own chunk
// and only loads when a chart is actually rendered.
import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import type { ReadinessAreaChart as ReadinessAreaChartImpl, AttemptsBarChart as AttemptsBarChartImpl } from "./charts/_dashboard-impl";

export type { ReadinessPoint, AttemptPoint } from "./charts/_dashboard-impl";

const ReadinessAreaChartLazy = lazy(() =>
  import("./charts/_dashboard-impl").then((m) => ({ default: m.ReadinessAreaChart })),
);
const AttemptsBarChartLazy = lazy(() =>
  import("./charts/_dashboard-impl").then((m) => ({ default: m.AttemptsBarChart })),
);

const Fallback = ({ h = "h-56" }: { h?: string }) => (
  <div className={`${h} rounded-md bg-muted/30 animate-pulse`} />
);

export function ReadinessAreaChart(props: ComponentProps<typeof ReadinessAreaChartImpl>) {
  return (
    <Suspense fallback={<Fallback />}>
      <ReadinessAreaChartLazy {...props} />
    </Suspense>
  );
}

export function AttemptsBarChart(props: ComponentProps<typeof AttemptsBarChartImpl>) {
  return (
    <Suspense fallback={<Fallback />}>
      <AttemptsBarChartLazy {...props} />
    </Suspense>
  );
}