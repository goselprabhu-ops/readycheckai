import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: number; // signed percentage change
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}

export function MetricCard({ label, value, delta, icon: Icon, hint, className }: MetricCardProps) {
  const positive = typeof delta === "number" && delta >= 0;
  return (
    <div className={cn("surface-card surface-card-interactive group p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-md bg-gradient-to-br from-primary/15 to-primary/5 p-2 text-primary ring-1 ring-inset ring-primary/10 transition-transform duration-200 group-hover:scale-105">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      {typeof delta === "number" ? (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            positive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      ) : null}
    </div>
  );
}