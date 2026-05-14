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

    let cancelled = false;
    const loadRoles = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userError || !userData.user || userData.user.id !== userId) {
        await supabase.auth.signOut().catch(() => {});
        if (!cancelled) {
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
        }
        setRoles([]);
        setActiveRoleState(null);
        return;
      }
      const r = (data ?? []).map((d) => d.role as AppRole);
      setRoles(r);
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