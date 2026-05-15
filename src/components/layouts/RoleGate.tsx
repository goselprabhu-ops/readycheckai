import type { ReactNode } from "react";
import { useUserRoles } from "@/shared/api/roles";
import type { AppRole } from "@/shared/types/roles";

export interface RoleGateProps {
  /** User must have ANY of these roles to see children. */
  anyOf: AppRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Client-side conditional render based on user roles. Use for in-page UI
 * (nav items, action buttons). Route-level enforcement still happens in
 * server functions / `_authenticated` layout — this is a UX layer only.
 */
export function RoleGate({ anyOf, fallback = null, children }: RoleGateProps) {
  const { hasAnyRole, isLoading } = useUserRoles();
  if (isLoading) return null;
  return hasAnyRole(anyOf) ? <>{children}</> : <>{fallback}</>;
}