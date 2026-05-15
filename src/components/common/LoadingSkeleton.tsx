import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SkeletonVariant = "card" | "list" | "chart" | "table" | "ring" | "text";

export interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "card", rows = 3, className }: LoadingSkeletonProps) {
  switch (variant) {
    case "ring":
      return (
        <div className={cn("flex items-center justify-center", className)}>
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      );
    case "chart":
      return <Skeleton className={cn("h-64 w-full rounded-md", className)} />;
    case "list":
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      );
    case "table":
      return (
        <div className={cn("space-y-1.5", className)}>
          <Skeleton className="h-9 w-full rounded-md" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      );
    case "text":
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );
    case "card":
    default:
      return (
        <div className={cn("space-y-3 rounded-lg border border-border/60 p-5", className)}>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      );
  }
}