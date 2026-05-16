import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DemoCandidate } from "./data";

const levelTone: Record<DemoCandidate["level"], string> = {
  "Placement Ready": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  "Almost Ready": "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  Developing: "bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-500/20",
  "At Risk": "bg-destructive/10 text-destructive ring-destructive/20",
};

export function ReadinessRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const tone =
    value >= 75 ? "oklch(0.72 0.16 160)" : value >= 55 ? "oklch(0.78 0.16 90)" : "oklch(0.65 0.22 25)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={6} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span className="absolute font-display text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function LevelBadge({ level }: { level: DemoCandidate["level"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        levelTone[level],
      )}
    >
      {level}
    </span>
  );
}

export function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

export function CandidateRow({
  c,
  active,
  onClick,
}: {
  c: DemoCandidate;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-border/70 bg-card p-4 transition-all duration-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5",
        active && "ring-2 ring-primary/40 border-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15">
          {c.initials}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-display text-sm font-semibold tracking-tight">{c.name}</p>
            <span className="text-[11px] tabular-nums text-muted-foreground">{c.lastActive}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{c.headline}</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <LevelBadge level={c.level} />
            <Badge variant="secondary" className="text-[10px] font-medium">
              {c.targetRole}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{c.college}</span>
          </div>
        </div>
        <ReadinessRing value={c.readiness} size={56} />
      </div>
    </button>
  );
}

export function DemoStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "primary" | "success" | "warning";
}) {
  const ring =
    accent === "success"
      ? "ring-emerald-500/20"
      : accent === "warning"
        ? "ring-amber-500/20"
        : "ring-primary/15";
  return (
    <div className={cn("surface-card surface-card-interactive p-4 ring-1 ring-inset", ring)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
