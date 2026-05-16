import { cn } from "@/lib/utils";
import { ANALYTICS_ROLE_LIST } from "@/shared/config/roles";
import { Check } from "lucide-react";

interface Props {
  value?: string | null;
  onChange: (label: string) => void;
  className?: string;
}

/**
 * Premium role-selection grid used in onboarding and elsewhere.
 * Uses the canonical analytics roles list. The selected role is stored as
 * the human-friendly label (matches profile.target_role storage).
 */
export function RoleSelector({ value, onChange, className }: Props) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {ANALYTICS_ROLE_LIST.map((r) => {
        const Icon = r.icon;
        const selected = value === r.label;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.label)}
            className={cn(
              "group relative flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all",
              "hover:border-primary/40 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary ring-2 ring-primary/30 shadow-[var(--shadow-sm)]"
                : "border-border/70",
            )}
            aria-pressed={selected}
          >
            <div
              className={cn(
                "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary group-hover:bg-primary/15",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-semibold tracking-tight">{r.label}</h3>
                {selected ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}