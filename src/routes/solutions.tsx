import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, Briefcase, Landmark, BookOpen, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/solutions")({
  head: () => ({ meta: [
    { title: "Solutions — ReadyCheck Lab" },
    { name: "description", content: "Readiness intelligence solutions for students, colleges, recruiters, training partners, and government education initiatives." },
  ] }),
  component: SolutionsPage,
});

const solutions = [
  { icon: GraduationCap, title: "For Students", desc: "Personal readiness scoring, adaptive learning paths, mock interviews, and career guidance powered by AI.", points: ["Resume & ATS analysis", "Skill gap diagnostics", "Adaptive roadmap", "AI mock interviews"] },
  { icon: Building2, title: "For Colleges", desc: "Institution-wide readiness analytics, batch tracking, placement intelligence, and curriculum gap reports.", points: ["Cohort dashboards", "Placement readiness index", "Curriculum gap reports", "Batch benchmarking"] },
  { icon: Briefcase, title: "For Recruiters", desc: "Validated, calibrated talent pools with transparent skill evidence and employability scores.", points: ["Verified skill profiles", "Role-fit scoring", "Pipeline analytics", "Bias-aware shortlisting"] },
  { icon: BookOpen, title: "For Training Partners", desc: "Outcome tracking, learner progress signals, and ROI proof for skill programs.", points: ["Outcome attribution", "Learner progression", "Program ROI", "Certification readiness"] },
  { icon: Landmark, title: "For Government", desc: "Population-scale workforce readiness intelligence to power policy and skilling missions.", points: ["State-wide readiness maps", "Sector demand signals", "Scheme impact tracking", "Policy dashboards"] },
  { icon: Users, title: "For Workforce", desc: "Continuous readiness intelligence to upskill, reskill, and prepare for emerging roles.", points: ["Future-skill tracking", "Career pivots", "Internal mobility", "Talent intelligence"] },
];

function SolutionsPage() {
  return (
    <MarketingShell
      eyebrow="SOLUTIONS"
      title={<>Readiness intelligence for <span className="text-[oklch(0.72_0.2_250)]">every stakeholder</span>.</>}
      intro="From individual learners to nations — ReadyCheck Lab adapts to the level of insight you need."
    >
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solutions.map((s) => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-7 hover:shadow-md transition-shadow">
            <div className="size-12 rounded-lg bg-primary/10 grid place-items-center text-primary">
              <s.icon className="size-6" />
            </div>
            <h3 className="font-display font-bold text-xl mt-4">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20 text-center">
        <Link to="/signup">
          <Button size="lg" className="gap-2">Start Free <ArrowRight className="size-4" /></Button>
        </Link>
      </section>
    </MarketingShell>
  );
}