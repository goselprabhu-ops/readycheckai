import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-gradient-to-b from-muted/20 to-muted/40 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-xl" />
          <div className="rounded-full bg-gradient-to-br from-primary/15 to-primary/5 p-3.5 text-primary ring-1 ring-inset ring-primary/15">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}