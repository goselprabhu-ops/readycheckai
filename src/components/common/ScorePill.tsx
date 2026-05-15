import { cn } from "@/lib/utils";

export interface ScorePillProps {
  score: number; // 0–100
  label?: string;
  className?: string;
}

function bandFor(score: number) {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600";
  if (score >= 60) return "bg-primary/10 text-primary";
  if (score >= 40) return "bg-amber-500/10 text-amber-600";
  return "bg-destructive/10 text-destructive";
}

export function ScorePill({ score, label, className }: ScorePillProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        bandFor(safe),
        className,
      )}
    >
      <span className="font-semibold tabular-nums">{safe}</span>
      {label ? <span className="opacity-80">{label}</span> : null}
    </span>
  );
}