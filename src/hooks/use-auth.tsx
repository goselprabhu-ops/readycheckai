/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "student"
  | "recruiter"
  | "college_admin"
  | "institute_admin"
  | "gov_admin"
  | "admin";

type RoleLookupError = {
  code?: string;
  status?: number;
  message?: string;
};

function isForbiddenAuthError(error: RoleLookupError) {
  return (
    error.code === "PGRST301" ||
    error.status === 403 ||
    /JWT|denied|forbidden/i.test(error.message ?? "")
  );
}

const ROLES_CACHE_KEY = "rcl:roles:v1";

type CachedRoles = { userId: string; roles: AppRole[]; at: number };

function readRoleCache(userId: string): AppRole[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROLES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRoles;
    if (parsed.userId !== userId) return null;
    return parsed.roles;
  } catch {
    return null;
  }
}

function writeRoleCache(userId: string, roles: AppRole[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedRoles = { userId, roles, at: Date.now() };
    localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy mode */
  }
}

function clearRoleCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ROLES_CACHE_KEY);
    localStorage.removeItem("activeRole");
  } catch {
    /* ignore */
  }
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  activeRole: AppRole | null;
  setActiveRole: (r: AppRole) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);
  const userId = session?.user?.id;

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "TOKEN_REFRESHED" && !s) {
        // refresh failed — clear stale local session
        supabase.auth.signOut().catch(() => {});
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setSession(null);
        setLoading(false);
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user || userData.user.id !== data.session.user.id) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setRoles([]);
        setActiveRoleState(null);
        setLoading(false);
        return;
      }

      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setActiveRoleState(null);
      return;
    }

    // Stale-while-revalidate: hydrate from cache instantly, then refresh.
    const cached = readRoleCache(userId);
    if (cached && cached.length) {
      setRoles(cached);
      const stored = (typeof window !== "undefined"
        ? (localStorage.getItem("activeRole") as AppRole | null)
        : null);
      setActiveRoleState(stored && cached.includes(stored) ? stored : (cached[0] ?? "student"));
    }

    let cancelled = false;
    const loadRoles = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userError || !userData.user || userData.user.id !== userId) {
        await supabase.auth.signOut().catch(() => {});
        if (!cancelled) {
          clearRoleCache();
          setRoles([]);
          setActiveRoleState(null);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (cancelled) return;

      if (error) {
        // Stale/revoked token → 403. Sign out to recover.
        if (isForbiddenAuthError(error)) {
          supabase.auth.signOut().catch(() => {});
          clearRoleCache();
        }
        setRoles([]);
        setActiveRoleState(null);
        return;
      }
      const r = (data ?? []).map((d) => d.role as AppRole);
      setRoles(r);
      writeRoleCache(userId, r);
      const stored = localStorage.getItem("activeRole") as AppRole | null;
      setActiveRoleState(stored && r.includes(stored) ? stored : (r[0] ?? "student"));
    };

    loadRoles();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setActiveRole = (r: AppRole) => {
    localStorage.setItem("activeRole", r);
    setActiveRoleState(r);
  };

  const signOut = async () => {
    clearRoleCache();
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        roles,
        activeRole,
        setActiveRole,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
