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
import { getSystemDiagnostics } from "@/lib/observability.functions";
import { listAuditEvents } from "@/lib/audit.functions";
import {
  Users,
  FileText,
  Brain,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Activity,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionsTab } from "@/features/admin/tabs/QuestionsTab";
import { AssessmentsTab } from "@/features/admin/tabs/AssessmentsTab";
import { BenchmarksTab } from "@/features/admin/tabs/BenchmarksTab";
import { AnalyticsTab } from "@/features/admin/tabs/AnalyticsTab";
import { ModerationTab } from "@/features/admin/tabs/ModerationTab";
import { RecommendationsTab } from "@/features/admin/tabs/RecommendationsTab";
import { BulkUploadTab } from "@/features/admin/tabs/BulkUploadTab";
import { MonitoringTab } from "@/features/admin/tabs/MonitoringTab";
import { ProductIntelligenceTab } from "@/features/admin/tabs/ProductIntelligenceTab";
import { FeedbackTab } from "@/features/admin/tabs/FeedbackTab";

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
  const diagnostics = useServerFn(getSystemDiagnostics);
  const audit = useServerFn(listAuditEvents);
  const [diag, setDiag] = useState<Awaited<ReturnType<typeof getSystemDiagnostics>> | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [auditRows, setAuditRows] = useState<
    Array<{
      kind: "system" | "security";
      id: string;
      created_at: string;
      event_type: string;
      severity: string;
      route?: string | null;
      source?: string | null;
      message?: string | null;
    }>
  >([]);
  const [auditLoading, setAuditLoading] = useState(false);
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
  const [emailHealth, setEmailHealth] = useState<{
    ok: boolean;
    counts: { pending: number; sent: number; failed: number; dlq: number; other: number };
    oldest_pending_age_seconds: number;
    last_activity_age_seconds: number | null;
    pending_stalled: boolean;
    cron_stalled: boolean;
    rate_limited: boolean;
    dlq_rate: number;
    retry_after_until: string | null;
  } | null>(null);

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

  const loadEmailHealth = async () => {
    try {
      const res = await fetch("/api/public/health/email-queue", { cache: "no-store" });
      if (!res.ok) return;
      setEmailHealth(await res.json());
    } catch {
      // Network errors are non-critical for the panel; banner just won't show.
    }
  };

  const loadDiagnostics = async () => {
    setDiagLoading(true);
    try {
      setDiag(await diagnostics());
    } catch (e: any) {
      // Surface errors quietly — diagnostics failure shouldn't block the panel.
      console.warn("diagnostics failed", e);
    } finally {
      setDiagLoading(false);
    }
  };

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const r = await audit({ data: { kind: "all", severity: "any", limit: 100 } });
      const merged = [...r.system, ...r.security].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      );
      setAuditRows(merged.slice(0, 100) as any);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadEmailHealth();
    loadDiagnostics();
    loadAudit();
    const t = setInterval(loadEmailHealth, 60_000);
    const d = setInterval(loadDiagnostics, 120_000);
    return () => {
      clearInterval(t);
      clearInterval(d);
    };
  }, []);

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

      {emailHealth && !emailHealth.ok && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email queue is stalled</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-0.5 text-sm">
              {emailHealth.pending_stalled && (
                <li>
                  Oldest pending email is{" "}
                  {Math.round(emailHealth.oldest_pending_age_seconds / 60)} min old
                  (threshold 5 min).
                </li>
              )}
              {emailHealth.cron_stalled && (
                <li>
                  No queue activity for{" "}
                  {emailHealth.last_activity_age_seconds !== null
                    ? Math.round(emailHealth.last_activity_age_seconds / 60)
                    : "?"}{" "}
                  min — cron may be down.
                </li>
              )}
              {emailHealth.rate_limited && (
                <li>
                  Provider rate-limited until{" "}
                  {emailHealth.retry_after_until
                    ? new Date(emailHealth.retry_after_until).toLocaleTimeString()
                    : "unknown"}
                  .
                </li>
              )}
              {emailHealth.dlq_rate >= 0.25 && (
                <li>
                  DLQ rate is {Math.round(emailHealth.dlq_rate * 100)}% over the last hour
                  ({emailHealth.counts.dlq} dead-lettered).
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="bulk">CSV Upload</TabsTrigger>
          <TabsTrigger value="benchmarks">Role Benchmarks</TabsTrigger>
          <TabsTrigger value="recs">Recommendations</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Diagnostics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDiagnostics}
            disabled={diagLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${diagLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!diag ? (
            <p className="text-sm text-muted-foreground">Loading diagnostics…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Database</div>
                  <div className="font-medium flex items-center gap-2">
                    <Badge variant={diag.db.ok ? "default" : "destructive"}>
                      {diag.db.ok ? "OK" : "DOWN"}
                    </Badge>
                    <span className="text-muted-foreground">{diag.db.latency_ms}ms</span>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Errors (24h)</div>
                  <div className="font-medium">
                    {diag.summary.totals?.error ?? 0} err ·{" "}
                    {diag.summary.totals?.critical ?? 0} crit
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Resume (24h)</div>
                  <div className="font-medium">
                    {diag.resume.total} total · {diag.resume.failed} failed
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">AI calls today</div>
                  <div className="font-medium">
                    {Object.values(diag.ai_usage_today).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {Object.entries(diag.env).map(([k, v]) => (
                  <Badge key={k} variant={v ? "secondary" : "destructive"} className="text-[10px]">
                    {k}: {v ? "set" : "missing"}
                  </Badge>
                ))}
              </div>

              {(diag.summary.recent_errors?.length ?? 0) > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Recent errors
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {diag.summary.recent_errors!.map((e) => (
                      <div
                        key={e.id}
                        className="text-xs flex items-start gap-2 border-l-2 border-destructive/60 pl-2"
                      >
                        <Badge
                          variant={e.severity === "critical" ? "destructive" : "secondary"}
                          className="text-[9px] uppercase"
                        >
                          {e.severity}
                        </Badge>
                        <span className="font-mono text-muted-foreground">
                          {new Date(e.created_at).toLocaleTimeString()}
                        </span>
                        <span className="font-medium">{e.event_type}</span>
                        <span className="text-muted-foreground truncate">{e.message ?? ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="monitoring"><MonitoringTab /></TabsContent>
        <TabsContent value="intelligence"><ProductIntelligenceTab /></TabsContent>

        <TabsContent value="users">

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
        </TabsContent>

        <TabsContent value="assessments"><AssessmentsTab /></TabsContent>
        <TabsContent value="questions"><QuestionsTab /></TabsContent>
        <TabsContent value="bulk"><BulkUploadTab /></TabsContent>
        <TabsContent value="benchmarks"><BenchmarksTab /></TabsContent>
        <TabsContent value="recs"><RecommendationsTab /></TabsContent>
        <TabsContent value="moderation"><ModerationTab /></TabsContent>
        <TabsContent value="feedback"><FeedbackTab /></TabsContent>

        <TabsContent value="audit">

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              Audit Log
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAudit}
              disabled={auditLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${auditLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {auditRows.map((e) => (
              <div
                key={`${e.kind}-${e.id}`}
                className="text-xs flex items-start gap-2 border-l-2 border-border pl-2 py-1"
              >
                <Badge variant="outline" className="text-[9px] uppercase">
                  {e.kind}
                </Badge>
                <Badge
                  variant={
                    e.severity === "critical" || e.severity === "error"
                      ? "destructive"
                      : e.severity === "warn"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-[9px] uppercase"
                >
                  {e.severity}
                </Badge>
                <span className="font-mono text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </span>
                <span className="font-medium">{e.event_type}</span>
                {e.route && (
                  <span className="text-muted-foreground truncate">{e.route}</span>
                )}
                {e.message && (
                  <span className="text-muted-foreground truncate">— {e.message}</span>
                )}
              </div>
            ))}
            {!auditLoading && auditRows.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No audit events yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Resume Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead className="w-28">Method</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-40">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.full_name ?? "—"}</TableCell>
                    <TableCell>{a.ats_score}/100</TableCell>
                    <TableCell>
                      <Badge
                        variant={a.method === "ai" ? "default" : "secondary"}
                        className="text-[10px] uppercase tracking-wide"
                      >
                        {a.method === "ai" ? "AI" : "Rules"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground text-sm">
                      {a.summary ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(a.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && analyses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No resume analyses yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}