import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { demoInstitution } from "@/features/demo/data";
import { DemoStat } from "@/features/demo/DemoComponents";

export const Route = createFileRoute("/_authenticated/college")({
  component: CollegeWorkspace,
});

function CollegeWorkspace() {
  const inst = demoInstitution;
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3" /> Preview Workspace
            </Badge>
            <p className="text-sm text-muted-foreground">
              Sample cohort analytics. Wire your institution roster to see real students.
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
        eyebrow="Placement Cell"
        title={inst.name}
        description="Track student readiness, placement funnels, and department-level engagement."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <DemoStat label="Total students" value={inst.students.toLocaleString()} />
        <DemoStat label="Departments" value={inst.departments} />
        <DemoStat label="Placement ready" value={`${inst.placementReady}%`} accent="success" />
        <DemoStat label="Avg readiness" value={inst.avgReadiness} accent="primary" />
      </div>

      <SectionCard
        title="Readiness by department"
        description="Composite readiness score and placement-ready share per department"
      >
        <div className="space-y-4">
          {inst.byDepartment.map((d) => (
            <div key={d.dept} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{d.dept}</span>
                <span className="text-muted-foreground tabular-nums">
                  {d.students} students · {d.ready}% ready · avg {d.avg}
                </span>
              </div>
              <Progress value={d.avg} className="h-2" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
