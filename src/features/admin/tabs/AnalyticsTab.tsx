import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPlatformAnalytics } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Users, Activity, FileText, Brain } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))", "#8884d8"];

export function AnalyticsTab() {
  const fn = useServerFn(getPlatformAnalytics);
  const [data, setData] = useState<Awaited<ReturnType<typeof getPlatformAnalytics>> | null>(null);
  useEffect(() => { fn().then(setData).catch(() => {}); }, []);

  if (!data) return <div className="text-muted-foreground text-sm">Loading analytics…</div>;
  const t = data.totals;
  const stats = [
    { label: "Total Users", value: t.users, icon: Users },
    { label: "Attempts (30d)", value: t.attempts_30d, icon: Brain },
    { label: "Interviews (30d)", value: t.interviews_30d, icon: Activity },
    { label: "Resumes (30d)", value: t.resumes_30d, icon: FileText },
    { label: "Avg Readiness", value: t.avgComposite, icon: Activity },
    { label: "Avg Interview", value: t.avgInterview, icon: Activity },
  ];

  const rolePie = Object.entries(data.roleDist).map(([name, value]) => ({ name, value }));
  const aiBars = Object.entries(data.aiByFeature).map(([feature, count]) => ({ feature, count }));
  const methodPie = Object.entries(data.resumeMethods).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3"><CardTitle className="text-xs text-muted-foreground font-medium">{s.label}</CardTitle><s.icon className="h-3.5 w-3.5 text-muted-foreground" /></CardHeader>
            <CardContent className="px-3 pb-3"><div className="text-xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Signups · last 30 days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.signupSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Target Role Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={rolePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 10 }}>
                  {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Assessment Topic Averages</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topicAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="avg" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AI Usage (30d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiBars} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Resume Pipeline · AI vs Rules (30d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={methodPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={{ fontSize: 10 }}>
                  {methodPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}