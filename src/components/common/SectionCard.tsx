import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "border-border/70 shadow-[var(--shadow-xs)] transition-shadow duration-200 hover:shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 pb-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="font-display text-[15px] font-semibold tracking-tight">
            {title}
          </CardTitle>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:shrink-0">
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}