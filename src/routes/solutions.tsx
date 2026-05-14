import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, Briefcase, Landmark, BookOpen, Users, ArrowRight } from "lucide-react";
import studentsImg from "@/assets/students-learning.jpg";
import teamImg from "@/assets/team-collaboration.jpg";
import analyticsImg from "@/assets/analytics-dashboard.jpg";

export const Route = createFileRoute("/solutions")({
  head: () => ({ meta: [
    { title: "Solutions — ReadyCheck Lab" },
    { name: "description", content: "Readiness intelligence solutions for students, colleges, recruiters, training partners, and government education initiatives." },
  ] }),
  component: SolutionsPage,
});

const solutions = [
  { icon: GraduationCap, image: studentsImg, title: "For Students", desc: "Personal readiness scoring, adaptive learning paths, mock interviews, and career guidance powered by AI.", points: ["Resume & ATS analysis", "Skill gap diagnostics", "Adaptive roadmap", "AI mock interviews"] },
  { icon: Building2, image: analyticsImg, title: "For Colleges", desc: "Institution-wide readiness analytics, batch tracking, placement intelligence, and curriculum gap reports.", points: ["Cohort dashboards", "Placement readiness index", "Curriculum gap reports", "Batch benchmarking"] },
  { icon: Briefcase, image: teamImg, title: "For Recruiters", desc: "Validated, calibrated talent pools with transparent skill evidence and employability scores.", points: ["Verified skill profiles", "Role-fit scoring", "Pipeline analytics", "Bias-aware shortlisting"] },
  { icon: BookOpen, image: studentsImg, title: "For Training Partners", desc: "Outcome tracking, learner progress signals, and ROI proof for skill programs.", points: ["Outcome attribution", "Learner progression", "Program ROI", "Certification readiness"] },
  { icon: Landmark, image: analyticsImg, title: "For Government", desc: "Population-scale workforce readiness intelligence to power policy and skilling missions.", points: ["State-wide readiness maps", "Sector demand signals", "Scheme impact tracking", "Policy dashboards"] },
  { icon: Users, image: teamImg, title: "For Workforce", desc: "Continuous readiness intelligence to upskill, reskill, and prepare for emerging roles.", points: ["Future-skill tracking", "Career pivots", "Internal mobility", "Talent intelligence"] },
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
          <div key={s.title} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="relative h-40 overflow-hidden">
              <img src={s.image} alt={s.title} loading="lazy" width={1024} height={1024} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              <div className="absolute bottom-3 left-3 size-11 rounded-lg bg-card/90 backdrop-blur border border-border grid place-items-center text-primary shadow">
                <s.icon className="size-5" />
              </div>
            </div>
            <div className="p-7 flex-1 flex flex-col">
              <h3 className="font-display font-bold text-xl">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
                ))}
              </ul>
            </div>
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