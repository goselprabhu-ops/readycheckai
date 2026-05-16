import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}

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
          <div className="shimmer h-32 w-32 rounded-full" />
        </div>
      );
    case "chart":
      return <Bar className={cn("h-64 w-full", className)} />;
    case "list":
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Bar key={i} className="h-10 w-full" />
          ))}
        </div>
      );
    case "table":
      return (
        <div className={cn("space-y-1.5", className)}>
          <Bar className="h-9 w-full" />
          {Array.from({ length: rows }).map((_, i) => (
            <Bar key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    case "text":
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Bar key={i} className="h-4 w-full" />
          ))}
        </div>
      );
    case "card":
    default:
      return (
        <div className={cn("space-y-3 rounded-lg border border-border/60 bg-card p-5 shadow-[var(--shadow-xs)]", className)}>
          <Bar className="h-3.5 w-1/3" />
          <Bar className="h-8 w-1/2" />
          <Bar className="h-3 w-2/3" />
        </div>
      );
  }
}