import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoCandidates } from "@/features/demo/data";
import { CandidateRow, DemoStat } from "@/features/demo/DemoComponents";

export const Route = createFileRoute("/_authenticated/recruiter")({
  component: RecruiterWorkspace,
});

function RecruiterWorkspace() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demoCandidates;
    return demoCandidates.filter((c) =>
      [c.name, c.headline, c.college, c.targetRole, ...c.topSkills]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const ready = demoCandidates.filter((c) => c.level === "Placement Ready").length;
  const avgReadiness = Math.round(
    demoCandidates.reduce((s, c) => s + c.readiness, 0) / demoCandidates.length,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3" /> Preview Workspace
            </Badge>
            <p className="text-sm text-muted-foreground">
              Sample candidate pipeline. Live data wiring is shipping in the next release.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/demo">
              Open full demo <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <PageHeader
        eyebrow="Recruiter"
        title="Candidate Pipeline"
        description="Search, filter, and shortlist placement-ready candidates by skill, score, and target role."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DemoStat label="Candidates in pool" value={demoCandidates.length} hint="+12 this week" />
        <DemoStat label="Placement ready" value={ready} hint={`${Math.round((ready / demoCandidates.length) * 100)}% of pool`} accent="success" />
        <DemoStat label="Avg readiness" value={avgReadiness} hint="Composite score" accent="primary" />
      </div>

      <SectionCard title="Search candidates" description="Match by skill, role, or college">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, skill, role, or college…"
            className="pl-9"
          />
        </div>
        <div className="mt-4 space-y-2">
          {filtered.map((c) => (
            <CandidateRow key={c.id} candidate={c} />
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No candidates match “{query}”. Try a different skill or role.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
