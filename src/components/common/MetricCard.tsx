import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className={cn("border-border/60", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
          {Icon ? (
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        {typeof delta === "number" ? (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              positive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}