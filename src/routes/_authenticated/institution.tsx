import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageContainer } from "@/components/layouts/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus,
  GraduationCap,
  Target,
  Activity,
} from "lucide-react";
import {
  listMyInstitutions,
  createInstitution,
  getInstitutionDashboard,
  createCohort,
  addStudentByEmail,
  exportInstitutionReport,
} from "@/lib/institution.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/institution")({
  component: InstitutionPage,
});

const BUCKET_COLORS = [
  "oklch(0.7 0.18 145)",
  "oklch(0.75 0.16 90)",
  "oklch(0.7 0.15 60)",
  "oklch(0.65 0.2 25)",
  "oklch(0.6 0.02 250)",
];

function InstitutionPage() {
  const listFn = useServerFn(listMyInstitutions);
  const createFn = useServerFn(createInstitution);
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: institutions, isLoading } = useQuery({
    queryKey: ["my-institutions"],
    queryFn: () => listFn(),
  });

  const activeId =
    selectedId ?? (institutions && institutions.length > 0 ? institutions[0].id : null);

  const createMut = useMutation({
    mutationFn: (input: { name: string; type: any; contact_email?: string; domain?: string }) =>
      createFn({ data: input }),
    onSuccess: (inst: any) => {
      toast.success(`Created ${inst.name}`);
      qc.invalidateQueries({ queryKey: ["my-institutions"] });
      setSelectedId(inst.id);
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Institution Dashboard"
        description="An employability operating system for colleges, bootcamps, and placement centers."
        icon={Building2}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {isLoading ? (
          <Skeleton className="h-10 w-72" />
        ) : institutions && institutions.length > 0 ? (
          <Select value={activeId ?? undefined} onValueChange={setSelectedId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select institution" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name} · {i.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">No institution yet. Create one to begin.</p>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1" /> New institution
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create institution</DialogTitle>
              <DialogDescription>
                You'll become the owner and can invite staff later.
              </DialogDescription>
            </DialogHeader>
            <CreateInstitutionForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {activeId ? (
        <InstitutionWorkspace institutionId={activeId} />
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Create your first institution to start tracking student readiness and placement.
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function CreateInstitutionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (d: { name: string; type: any; contact_email?: string; domain?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"college" | "bootcamp" | "placement_center" | "other">("college");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Institute of Tech" />
      </div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="college">College</SelectItem>
            <SelectItem value="bootcamp">Bootcamp</SelectItem>
            <SelectItem value="placement_center">Placement Center</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contact email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="placement@abc.edu" />
        </div>
        <div>
          <Label>Domain</Label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="abc.edu" />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit({ name, type, contact_email: email, domain })}
          disabled={!name || loading}
        >
          {loading ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function InstitutionWorkspace({ institutionId }: { institutionId: string }) {
  const fn = useServerFn(getInstitutionDashboard);
  const cohortFn = useServerFn(createCohort);
  const studentFn = useServerFn(addStudentByEmail);
  const exportFn = useServerFn(exportInstitutionReport);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["institution-dashboard", institutionId],
    queryFn: () => fn({ data: { institution_id: institutionId } }),
  });

  const cohortMut = useMutation({
    mutationFn: (input: any) => cohortFn({ data: { institution_id: institutionId, ...input } }),
    onSuccess: () => {
      toast.success("Cohort created");
      qc.invalidateQueries({ queryKey: ["institution-dashboard", institutionId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const studentMut = useMutation({
    mutationFn: (input: any) => studentFn({ data: { institution_id: institutionId, ...input } }),
    onSuccess: () => {
      toast.success("Student linked");
      qc.invalidateQueries({ queryKey: ["institution-dashboard", institutionId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const handleExport = async () => {
    try {
      const result: any = await exportFn({ data: { institution_id: institutionId } });
      const dash = result.data ?? {};
      const rows = [
        ["Section", "Metric", "Value"],
        ["totals", "students", dash.totals?.students ?? 0],
        ["totals", "with_readiness", dash.totals?.with_readiness ?? 0],
        ["totals", "avg_readiness", dash.totals?.avg_readiness ?? 0],
        ["totals", "avg_sql", dash.totals?.avg_sql ?? 0],
        ["totals", "avg_python", dash.totals?.avg_python ?? 0],
        ["totals", "avg_resume", dash.totals?.avg_resume ?? 0],
        ["funnel", "placement_ready", dash.readiness_buckets?.placement_ready ?? 0],
        ["funnel", "almost_ready", dash.readiness_buckets?.almost_ready ?? 0],
        ["funnel", "developing", dash.readiness_buckets?.developing ?? 0],
        ["funnel", "at_risk", dash.readiness_buckets?.at_risk ?? 0],
        ["funnel", "unscored", dash.readiness_buckets?.unscored ?? 0],
      ];
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `institution-report-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const dash: any = (data as any)?.dashboard ?? {};
  const cohorts: any[] = (data as any)?.cohorts ?? [];
  const totals = dash.totals ?? {};
  const buckets = dash.readiness_buckets ?? {};
  const byDept: any[] = dash.by_department ?? [];
  const byCohort: any[] = dash.by_cohort ?? [];
  const weak = dash.weak_skills ?? {};
  const top: any[] = dash.top_students ?? [];
  const atRisk: any[] = dash.at_risk_students ?? [];

  const funnel = [
    { label: "Placement Ready", value: buckets.placement_ready ?? 0 },
    { label: "Almost Ready", value: buckets.almost_ready ?? 0 },
    { label: "Developing", value: buckets.developing ?? 0 },
    { label: "At Risk", value: buckets.at_risk ?? 0 },
    { label: "Unscored", value: buckets.unscored ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Students" value={totals.students ?? 0} />
        <KpiCard icon={Target} label="Avg Readiness" value={`${totals.avg_readiness ?? 0}%`} />
        <KpiCard
          icon={TrendingUp}
          label="Placement Ready"
          value={buckets.placement_ready ?? 0}
          accent="text-emerald-500"
        />
        <KpiCard
          icon={AlertTriangle}
          label="At Risk"
          value={buckets.at_risk ?? 0}
          accent="text-amber-500"
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export report
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="placement">Placement Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Readiness funnel</CardTitle>
                <CardDescription>Distribution of students across readiness bands</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnel}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {funnel.map((_, i) => (
                        <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skill averages</CardTitle>
                <CardDescription>Across all linked students</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[
                      { skill: "SQL", value: totals.avg_sql ?? 0 },
                      { skill: "Python", value: totals.avg_python ?? 0 },
                      { skill: "Resume", value: totals.avg_resume ?? 0 },
                      { skill: "Readiness", value: totals.avg_readiness ?? 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="skill" fontSize={11} />
                    <YAxis fontSize={11} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <WeakSkillCard label="SQL weak (<50)" value={weak.sql_weak ?? 0} />
            <WeakSkillCard label="Python weak (<50)" value={weak.python_weak ?? 0} />
            <WeakSkillCard label="Resume weak (<50)" value={weak.resume_weak ?? 0} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {byDept.length === 0 ? (
                <p className="text-sm text-muted-foreground">No departments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Avg readiness</TableHead>
                      <TableHead className="text-right">Placement ready</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byDept.map((d: any) => (
                      <TableRow key={d.dept}>
                        <TableCell className="font-medium">{d.dept}</TableCell>
                        <TableCell className="text-right">{d.students}</TableCell>
                        <TableCell className="text-right">{d.avg_readiness}%</TableCell>
                        <TableCell className="text-right">{d.ready}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create cohort</CardTitle>
            </CardHeader>
            <CardContent>
              <CohortForm onSubmit={(d) => cohortMut.mutate(d)} loading={cohortMut.isPending} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cohort analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {byCohort.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cohort data yet. Create cohorts and link students.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cohort</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Avg readiness</TableHead>
                      <TableHead className="text-right">Ready</TableHead>
                      <TableHead className="text-right">At risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCohort.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.cohort_name}</TableCell>
                        <TableCell>{c.cohort_department ?? "—"}</TableCell>
                        <TableCell className="text-right">{c.students}</TableCell>
                        <TableCell className="text-right">{c.avg_readiness}%</TableCell>
                        <TableCell className="text-right text-emerald-500">{c.ready}</TableCell>
                        <TableCell className="text-right text-amber-500">{c.at_risk}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All cohorts</CardTitle>
            </CardHeader>
            <CardContent>
              {cohorts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cohorts yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cohorts.map((c: any) => (
                    <Badge key={c.id} variant="secondary">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {c.name}
                      {c.department && <span className="opacity-70 ml-1">· {c.department}</span>}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Link a student</CardTitle>
              <CardDescription>
                Student must already have a ReadyCheck account. Use the email they signed up with.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentForm
                cohorts={cohorts}
                onSubmit={(d) => studentMut.mutate(d)}
                loading={studentMut.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top performers</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentsTable rows={top} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Needs support
              </CardTitle>
              <CardDescription>Students with low or no readiness score</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentsTable rows={atRisk} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placement" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Placement probability</CardTitle>
                <CardDescription>Based on latest readiness scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={funnel}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {funnel.map((_, i) => (
                        <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Placement funnel insight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FunnelRow label="Total tracked" value={totals.students ?? 0} pct={100} />
                <FunnelRow
                  label="Engaged (scored)"
                  value={totals.with_readiness ?? 0}
                  pct={pctOf(totals.with_readiness, totals.students)}
                  tone="bg-sky-500"
                />
                <FunnelRow
                  label="Ready + Almost"
                  value={(buckets.placement_ready ?? 0) + (buckets.almost_ready ?? 0)}
                  pct={pctOf((buckets.placement_ready ?? 0) + (buckets.almost_ready ?? 0), totals.students)}
                  tone="bg-emerald-500"
                />
                <FunnelRow
                  label="Placement ready"
                  value={buckets.placement_ready ?? 0}
                  pct={pctOf(buckets.placement_ready, totals.students)}
                  tone="bg-primary"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: any;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-md bg-muted flex items-center justify-center ${accent ?? "text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeakSkillCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Activity className="h-5 w-5 text-amber-500" />
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelRow({
  label,
  value,
  pct,
  tone = "bg-muted-foreground/40",
}: {
  label: string;
  value: number;
  pct: number;
  tone?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function pctOf(a?: number, b?: number) {
  if (!a || !b) return 0;
  return Math.round((a / b) * 100);
}

function StudentsTable({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No students yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Target role</TableHead>
          <TableHead>Dept</TableHead>
          <TableHead className="text-right">Readiness</TableHead>
          <TableHead className="text-right">SQL</TableHead>
          <TableHead className="text-right">Python</TableHead>
          <TableHead className="text-right">Resume</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s, i) => (
          <TableRow key={s.user_id ?? i}>
            <TableCell className="font-medium">{s.full_name ?? "—"}</TableCell>
            <TableCell>{s.target_role ?? "—"}</TableCell>
            <TableCell>{s.department ?? "—"}</TableCell>
            <TableCell className="text-right">
              {s.readiness != null ? `${s.readiness}%` : "—"}
            </TableCell>
            <TableCell className="text-right">{s.sql_score ?? "—"}</TableCell>
            <TableCell className="text-right">{s.python_score ?? "—"}</TableCell>
            <TableCell className="text-right">{s.resume_score ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CohortForm({
  onSubmit,
  loading,
}: {
  onSubmit: (d: any) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="DA Batch 2026" />
      </div>
      <div>
        <Label>Department</Label>
        <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Data Analytics" />
      </div>
      <Button
        size="sm"
        disabled={!name || loading}
        onClick={() => {
          onSubmit({ name, department: dept });
          setName("");
          setDept("");
        }}
      >
        {loading ? "Saving…" : "Add cohort"}
      </Button>
    </div>
  );
}

function StudentForm({
  cohorts,
  onSubmit,
  loading,
}: {
  cohorts: any[];
  onSubmit: (d: any) => void;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [cohortId, setCohortId] = useState<string | undefined>();
  const [dept, setDept] = useState("");
  const [enroll, setEnroll] = useState("");
  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div>
        <Label>Student email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@abc.edu" />
      </div>
      <div className="min-w-40">
        <Label>Cohort</Label>
        <Select value={cohortId} onValueChange={setCohortId}>
          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Department</Label>
        <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="CSE" />
      </div>
      <div>
        <Label>Enrollment #</Label>
        <Input value={enroll} onChange={(e) => setEnroll(e.target.value)} />
      </div>
      <Button
        size="sm"
        disabled={!email || loading}
        onClick={() => {
          onSubmit({ email, cohort_id: cohortId, department: dept, enrollment_no: enroll });
          setEmail("");
          setDept("");
          setEnroll("");
        }}
      >
        {loading ? "Linking…" : "Add student"}
      </Button>
    </div>
  );
}