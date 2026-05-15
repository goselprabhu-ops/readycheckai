import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/marketing-shell";
import {
  ShieldCheck,
  Lock,
  Database,
  Eye,
  KeyRound,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security & Status — ReadyCheck Lab" },
      {
        name: "description",
        content:
          "How ReadyCheck Lab protects your data: encryption, access control, audit logs, GDPR/DPDP compliance, and live system status.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Security & Status — ReadyCheck Lab" },
      {
        property: "og:description",
        content:
          "Encryption at rest, row-level security, audit logging, data export, and live uptime for ReadyCheck Lab.",
      },
    ],
  }),
  component: SecurityPage,
});

type Health = {
  ok: boolean;
  env_ok?: boolean;
  db_ok?: boolean;
  db_latency_ms?: number;
  checked_at?: string;
};

function SecurityPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/public/health", { cache: "no-store" });
        const j = (await res.json()) as Health;
        if (alive) setHealth(j);
      } catch {
        if (alive) setHealth({ ok: false });
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const pillars = [
    {
      icon: Lock,
      title: "Encryption everywhere",
      body: "TLS 1.2+ in transit. AES-256 at rest for database and file storage. Resume PDFs live in a private bucket — only you and your authorised admins can read them.",
    },
    {
      icon: Database,
      title: "Row-Level Security",
      body: "Every table enforces Postgres RLS. Your rows are scoped to your user id; cross-user reads require an explicit admin role checked server-side.",
    },
    {
      icon: KeyRound,
      title: "Least-privilege functions",
      body: "All SECURITY DEFINER helpers are restricted to the service role. Internal AI usage caps and cooldowns are enforced in the database, not the client.",
    },
    {
      icon: Eye,
      title: "Audit logging",
      body: "Authentication, role changes, AI calls, and admin actions are written to immutable system_events / security_events tables, retained for 90 days.",
    },
    {
      icon: ShieldCheck,
      title: "Compliance-ready",
      body: "GDPR & India DPDP aligned. Self-serve data export from your profile, account-deletion on request, and a documented sub-processor list.",
    },
    {
      icon: Activity,
      title: "Always-on monitoring",
      body: "Web Vitals, client errors, and server latency stream into health dashboards. Critical errors page on-call within minutes.",
    },
  ];

  return (
    <MarketingShell
      eyebrow="Trust Center"
      title="Security & Status"
      intro="ReadyCheck Lab is built for institutions. Here's exactly how we protect your data and how you can verify it's working — live."
    >
      <section className="border-b border-border/60">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                Live System Status
              </CardTitle>
              {!loading && health && (
                <Badge variant={health.ok ? "default" : "destructive"}>
                  {health.ok ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Operational
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" /> Degraded
                    </>
                  )}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {loading ? (
                "Checking live status…"
              ) : health ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="API" value={health.env_ok ? "OK" : "Down"} good={!!health.env_ok} />
                  <Stat label="Database" value={health.db_ok ? "OK" : "Down"} good={!!health.db_ok} />
                  <Stat
                    label="DB latency"
                    value={
                      typeof health.db_latency_ms === "number" ? `${health.db_latency_ms} ms` : "—"
                    }
                    good
                  />
                  <Stat
                    label="Checked"
                    value={
                      health.checked_at
                        ? new Date(health.checked_at).toLocaleTimeString()
                        : "—"
                    }
                    good
                  />
                </div>
              ) : (
                "Status unavailable."
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-display font-semibold mb-8">
          How your data is protected
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pillars.map((p) => (
            <Card key={p.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <p.icon className="h-4 w-4 text-primary" />
                  {p.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {p.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
            Your rights
          </h2>
          <p className="text-muted-foreground mb-6">
            You own your data. Export it, correct it, or delete it any time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/profile">Export my data</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Request deletion</Link>
            </Button>
            <Button asChild variant="ghost">
              <a href="/api/public/health" target="_blank" rel="noreferrer">
                Public health endpoint
              </a>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-medium ${good ? "" : "text-destructive"}`}>{value}</div>
    </div>
  );
}