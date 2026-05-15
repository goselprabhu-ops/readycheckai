import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminOverview,
  listAdminUsers,
  listAdminResumeAnalyses,
  setUserRole,
} from "@/lib/admin.functions";
import { Users, FileText, Brain, TrendingUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPanel,
});

const ALL_ROLES = ["student", "recruiter", "college_admin", "institute_admin", "gov_admin", "admin"] as const;
type Role = typeof ALL_ROLES[number];

interface AdminUser {
  id: string;
  full_name: string | null;
  headline: string | null;
  college: string | null;
  target_role: string | null;
  created_at: string;
  roles: Role[];
}

function AdminPanel() {
  const overview = useServerFn(getAdminOverview);
  const list = useServerFn(listAdminUsers);
  const listResumes = useServerFn(listAdminResumeAnalyses);
  const setRole = useServerFn(setUserRole);
  const [totals, setTotals] = useState({
    users: 0,
    assessments: 0,
    resumes: 0,
    resumesAi: 0,
    resumesRules: 0,
    avgComposite: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analyses, setAnalyses] = useState<
    Array<{
      id: string;
      user_id: string;
      full_name: string | null;
      ats_score: number;
      method: "ai" | "rules";
      summary: string | null;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [o, l, r] = await Promise.all([overview(), list(), listResumes()]);
      setTotals(o.totals);
      setUsers(l.users as AdminUser[]);
      setAnalyses(r.analyses);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (targetUserId: string, role: Role, grant: boolean) => {
    try {
      await setRole({ data: { targetUserId, role, grant } });
      toast.success(`${grant ? "Granted" : "Removed"} ${role}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const stats = [
    { label: "Users", value: totals.users, icon: Users },
    { label: "Assessments", value: totals.assessments, icon: Brain },
    {
      label: "Resumes Analyzed",
      value: loading
        ? "—"
        : `${totals.resumes} (${totals.resumesAi} AI · ${totals.resumesRules} rules)`,
      icon: FileText,
    },
    { label: "Avg Readiness", value: `${totals.avgComposite}`, icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "—" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Target role</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                    <TableCell>{u.target_role ?? "—"}</TableCell>
                    <TableCell>{u.college ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length ? u.roles.map((r) => (
                          <Badge key={r} variant="secondary">{r}</Badge>
                        )) : <span className="text-muted-foreground text-xs">none</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ALL_ROLES.map((r) => {
                          const has = u.roles.includes(r);
                          return (
                            <Button
                              key={r}
                              size="sm"
                              variant={has ? "default" : "outline"}
                              className="h-7 px-2 text-xs"
                              onClick={() => toggleRole(u.id, r, !has)}
                            >
                              {has ? `−${r}` : `+${r}`}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}