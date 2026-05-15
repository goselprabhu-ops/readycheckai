/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/shared/types/roles";

/**
 * Lightweight wrapper around `useAuth()` that exposes a stable shape for
 * V1 feature code. Keeps the existing AuthProvider as the single source of
 * truth for session + roles; this just curates a typed surface.
 */
interface UserContextValue {
  userId: string | null;
  email: string | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const value = useMemo<UserContextValue>(
    () => ({
      userId: auth.user?.id ?? null,
      email: auth.user?.email ?? null,
      roles: auth.roles,
      activeRole: auth.activeRole,
      isAuthenticated: !!auth.user,
      isLoading: auth.loading,
    }),
    [auth],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    // Fall back to direct auth read so callers can use the hook even
    // without explicit provider wrapping (the auth hook is global).
    const auth = useAuth();
    return {
      userId: auth.user?.id ?? null,
      email: auth.user?.email ?? null,
      roles: auth.roles,
      activeRole: auth.activeRole,
      isAuthenticated: !!auth.user,
      isLoading: auth.loading,
    };
  }
  return ctx;
}