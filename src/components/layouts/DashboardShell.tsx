import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { DASHBOARD_NAV, NAV_GROUP_LABELS, type NavItem } from "@/shared/config/nav";
import { useUserRoles } from "@/shared/api/roles";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { TopNav } from "./TopNav";

function groupedItems(items: NavItem[]) {
  const groups: Record<NavItem["group"], NavItem[]> = {
    main: [],
    career: [],
    growth: [],
    manage: [],
  };
  for (const item of items) groups[item.group].push(item);
  return groups;
}

export interface DashboardShellProps {
  children: ReactNode;
  topNavRight?: ReactNode;
}

export function DashboardShell({ children, topNavRight }: DashboardShellProps) {
  const { hasAnyRole } = useUserRoles();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const visibleItems = DASHBOARD_NAV.filter(
    (item) => !item.roles || hasAnyRole(item.roles),
  );
  const groups = groupedItems(visibleItems);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display font-semibold">
                R
              </div>
              <span className="font-display text-sm font-semibold tracking-tight">
                ReadyCheck Lab
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            {(Object.keys(groups) as NavItem["group"][]).map((groupKey) => {
              const items = groups[groupKey];
              if (!items.length) return null;
              return (
                <SidebarGroup key={groupKey}>
                  <SidebarGroupLabel>{NAV_GROUP_LABELS[groupKey]}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = path === item.to;
                        return (
                          <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton asChild isActive={active}>
                              <Link to={item.to} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav rightSlot={topNavRight} />
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}