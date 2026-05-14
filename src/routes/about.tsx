import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Target, Compass, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — ReadyCheck Lab" },
    { name: "description", content: "ReadyCheck Lab is an innovation-driven AI platform for measuring and improving readiness across learners, institutions, and workforces." },
  ] }),
  component: AboutPage,
});

const values = [
  { icon: Compass, title: "Modern", desc: "Built on the latest AI and adaptive learning research." },
  { icon: Sparkles, title: "Intelligent", desc: "Every signal converted into actionable readiness insight." },
  { icon: Target, title: "Scalable", desc: "From a single learner to nation-scale education systems." },
  { icon: Heart, title: "Human-Centered", desc: "Designed around outcomes for real people, not metrics alone." },
];

function AboutPage() {
  return (
    <MarketingShell
      eyebrow="ABOUT US"
      title={<>Transforming how readiness is <span className="text-[oklch(0.72_0.2_250)]">measured and improved</span>.</>}
      intro="ReadyCheck Lab is an AI-powered readiness intelligence platform built to help learners, educators, institutions, and organizations grow with precision."
    >
      <section className="max-w-5xl mx-auto px-6 py-20 space-y-12">
        <div>
          <span className="text-xs font-semibold tracking-wider text-primary">CORE VISION</span>
          <p className="font-display font-semibold text-2xl md:text-3xl mt-3 leading-snug">
            To build a future where every learner and institution can accurately understand
            their readiness, improve with precision, and grow with confidence.
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold tracking-wider text-primary">CORE MISSION</span>
          <p className="text-muted-foreground mt-3">We develop intelligent systems that:</p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-3">
            {["Measure learning and skill readiness",
              "Personalize improvement pathways",
              "Deliver actionable educational insights",
              "Support data-driven growth for students and institutions"].map((m) => (
              <li key={m} className="bg-card border border-border rounded-lg p-4 text-sm">{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-xs font-semibold tracking-wider text-primary">BRAND PHILOSOPHY</span>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {[
              { w: "Measure", d: "Understand current readiness." },
              { w: "Learn", d: "Enable intelligent improvement." },
              { w: "Improve", d: "Achieve measurable growth outcomes." },
            ].map((p) => (
              <div key={p.w} className="bg-card border border-border rounded-xl p-6">
                <div className="font-display font-bold text-2xl text-primary">{p.w}</div>
                <p className="text-sm text-muted-foreground mt-2">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold tracking-wider text-primary">STYLE</span>
          <h3 className="font-display font-bold text-2xl mt-3">Modern · Intelligent · Scalable · Human-Centered</h3>
          <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-card border border-border rounded-xl p-5">
                <v.icon className="size-7 text-primary" strokeWidth={1.8} />
                <div className="font-display font-bold mt-3">{v.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}