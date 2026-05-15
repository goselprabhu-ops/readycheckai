import { Badge } from "@/components/ui/badge";
import { ANALYTICS_ROLE_CONFIG } from "@/shared/config/roles";
import type { AnalyticsRole } from "@/shared/types/roles";
import { cn } from "@/lib/utils";

export interface RoleBadgeProps {
  role: AnalyticsRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const cfg = ANALYTICS_ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-normal", className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}