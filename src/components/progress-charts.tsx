import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import type {
  ReadinessGrowthChart as ReadinessGrowthChartImpl,
  ResumeTrendChart as ResumeTrendChartImpl,
  TopicLineChart as TopicLineChartImpl,
} from "./charts/_progress-impl";

export type { ReadinessSeriesPoint } from "./charts/_progress-impl";

const ReadinessGrowthChartLazy = lazy(() =>
  import("./charts/_progress-impl").then((m) => ({ default: m.ReadinessGrowthChart })),
);
const ResumeTrendChartLazy = lazy(() =>
  import("./charts/_progress-impl").then((m) => ({ default: m.ResumeTrendChart })),
);
const TopicLineChartLazy = lazy(() =>
  import("./charts/_progress-impl").then((m) => ({ default: m.TopicLineChart })),
);

const Fallback = ({ h = "h-56" }: { h?: string }) => (
  <div className={`${h} rounded-md bg-muted/30 animate-pulse`} />
);

export function ReadinessGrowthChart(props: ComponentProps<typeof ReadinessGrowthChartImpl>) {
  return (
    <Suspense fallback={<Fallback h="h-72" />}>
      <ReadinessGrowthChartLazy {...props} />
    </Suspense>
  );
}

export function ResumeTrendChart(props: ComponentProps<typeof ResumeTrendChartImpl>) {
  return (
    <Suspense fallback={<Fallback />}>
      <ResumeTrendChartLazy {...props} />
    </Suspense>
  );
}

export function TopicLineChart(props: ComponentProps<typeof TopicLineChartImpl>) {
  return (
    <Suspense fallback={<Fallback />}>
      <TopicLineChartLazy {...props} />
    </Suspense>
  );
}