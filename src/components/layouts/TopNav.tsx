import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DASHBOARD_NAV } from "@/shared/config/nav";

function useBreadcrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const match = DASHBOARD_NAV.find((n) => n.to === path);
  if (match) return [{ label: match.label, to: match.to }];
  // fallback: split path
  const parts = path.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    to: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

export function TopNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const crumbs = useBreadcrumbs();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1 truncate">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span
              className={
                i === crumbs.length - 1
                  ? "truncate font-medium text-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {c.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">{rightSlot}</div>
    </header>
  );
}