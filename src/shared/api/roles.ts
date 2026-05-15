import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyRoles } from "@/lib/roles.functions";
import { queryKeys } from "./query-keys";
import type { AppRole } from "@/shared/types/roles";

/**
 * Returns the current user's app roles (from public.user_roles).
 * Returns an empty array when the user is not signed in.
 */
export function useUserRoles() {
  const { user } = useAuth();
  const fetchRoles = useServerFn(getMyRoles);

  const query = useQuery({
    queryKey: queryKeys.roles(user?.id),
    queryFn: () => fetchRoles(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const roles = (query.data ?? []) as AppRole[];

  return {
    roles,
    hasRole: (role: AppRole) => roles.includes(role),
    hasAnyRole: (rs: AppRole[]) => rs.some((r) => roles.includes(r)),
    isLoading: query.isLoading,
  };
}