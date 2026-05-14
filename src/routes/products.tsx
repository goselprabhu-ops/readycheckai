import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { FileText, Brain, Map, MessageSquare, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [
    { title: "Products — ReadyCheck Lab" },
    { name: "description", content: "AI-powered products: resume intelligence, adaptive assessments, learning roadmaps, mock interviews, and analytics dashboards." },
  ] }),
  component: ProductsPage,
});

const products = [
  { icon: FileText, name: "Resume Intelligence", desc: "ATS scoring, gap detection, and skill extraction in seconds." },
  { icon: Brain, name: "Adaptive Assessments", desc: "Industry-calibrated MCQs that adjust to candidate skill level." },
  { icon: Map, name: "Adaptive Roadmap", desc: "Personalized learning paths to close skill gaps efficiently." },
  { icon: MessageSquare, name: "AI Mock Interviews", desc: "STAR-format interview practice with real hiring patterns." },
  { icon: BarChart3, name: "Employability Engine", desc: "Composite scoring blending resume, skills, and market demand." },
  { icon: ShieldCheck, name: "Institutional Analytics", desc: "Aggregated readiness intelligence with privacy-first architecture." },
];

function ProductsPage() {
  return (
    <MarketingShell
      eyebrow="PRODUCTS"
      title={<>Six products. <span className="text-[oklch(0.72_0.2_250)]">One readiness loop.</span></>}
      intro="Every ReadyCheck Lab product feeds the same closed-loop intelligence: measure, learn, improve."
    >
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p, i) => (
          <div key={p.name} className="relative bg-card border border-border rounded-2xl p-7 overflow-hidden">
            <span className="absolute top-4 right-5 font-mono text-xs text-muted-foreground">/{String(i + 1).padStart(2, "0")}</span>
            <p.icon className="size-9 text-primary" strokeWidth={1.8} />
            <h3 className="font-display font-bold text-lg mt-4">{p.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{p.desc}</p>
          </div>
        ))}
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20 text-center">
        <Link to="/signup">
          <Button size="lg" className="gap-2">Try the platform <ArrowRight className="size-4" /></Button>
        </Link>
      </section>
    </MarketingShell>
  );
}