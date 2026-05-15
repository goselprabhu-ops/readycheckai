import type { ReactNode } from "react";
import { SectionCard } from "./SectionCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";

export interface ChartContainerProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  height?: number;
  children: ReactNode;
}

export function ChartContainer({
  title,
  description,
  action,
  isLoading,
  isEmpty,
  emptyTitle = "No data yet",
  emptyDescription = "Once activity starts flowing in, charts will populate here.",
  height = 280,
  children,
}: ChartContainerProps) {
  return (
    <SectionCard title={title} description={description} action={action}>
      <div style={{ height }} className="w-full">
        {isLoading ? (
          <LoadingSkeleton variant="chart" />
        ) : isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </div>
    </SectionCard>
  );
}