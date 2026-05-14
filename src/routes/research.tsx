import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Microscope, FlaskConical, BookMarked, Network } from "lucide-react";
import labImg from "@/assets/research-lab.jpg";
import networkImg from "@/assets/ai-network.jpg";

export const Route = createFileRoute("/research")({
  head: () => ({ meta: [
    { title: "Research — ReadyCheck Lab" },
    { name: "description", content: "Research at the intersection of AI, education, readiness analytics, and adaptive learning." },
  ] }),
  component: ResearchPage,
});

const themes = [
  { icon: Microscope, title: "Readiness Science", desc: "Operationalizing 'readiness' as a measurable, multi-dimensional construct across academic, skill, and behavioral signals." },
  { icon: FlaskConical, title: "Adaptive Assessment", desc: "Item response theory and LLM-calibrated assessments that adapt to learner ability without sacrificing fairness." },
  { icon: Network, title: "Skill Intelligence", desc: "Mapping skills to evolving market demand using continuous labor-market signals and graph models." },
  { icon: BookMarked, title: "Learning Pathways", desc: "Reinforcement-learning-driven pathway generation that maximizes long-term outcome, not short-term engagement." },
];

function ResearchPage() {
  return (
    <MarketingShell
      eyebrow="RESEARCH"
      title={<>Where AI meets <span className="text-[oklch(0.72_0.2_250)]">measurable learning outcomes</span>.</>}
      intro="Our research advances how readiness is defined, measured, and improved at scale."
    >
      <section className="max-w-7xl mx-auto px-6 pt-16">
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
          <img src={labImg} alt="ReadyCheck Lab research team" loading="lazy" width={1024} height={1024} className="w-full h-auto block max-h-[480px] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-6">
        {themes.map((t) => (
          <div key={t.title} className="bg-card border border-border rounded-2xl p-8">
            <t.icon className="size-9 text-primary" strokeWidth={1.8} />
            <h3 className="font-display font-bold text-xl mt-4">{t.title}</h3>
            <p className="text-muted-foreground mt-3">{t.desc}</p>
          </div>
        ))}
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <img src={networkImg} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary/60" />
          <div className="relative p-10 text-center">
            <h2 className="font-display font-bold text-2xl">Research partnerships</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              We collaborate with universities, education boards, and workforce agencies on
              longitudinal readiness studies. Reach out if you'd like to partner.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}