import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brain, FileText, GraduationCap, LineChart, MessageSquare, Sparkles, Target, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const modules = [
  { icon: FileText, title: "Resume Intelligence", desc: "AI parses, scores, and rewrites your resume against real ATS criteria." },
  { icon: Brain, title: "Skill Assessment", desc: "Validated SQL, Python, and analytics tests calibrated to industry demand." },
  { icon: LineChart, title: "Market Intelligence", desc: "Live demand signals from job markets — see where your skills win." },
  { icon: Target, title: "Adaptive Roadmap", desc: "Personalized learning paths that close the gap to your target role." },
  { icon: MessageSquare, title: "Mock Interviews", desc: "Practice with an AI interviewer trained on real hiring patterns." },
  { icon: Sparkles, title: "Employability Score", desc: "A single number that predicts how ready you are to be hired." },
];

const segments = [
  { icon: GraduationCap, label: "Students", desc: "Career readiness" },
  { icon: Users, label: "Colleges", desc: "Placement tracking" },
  { icon: Target, label: "Recruiters", desc: "Candidate filtering" },
  { icon: Brain, label: "Institutes", desc: "Skill benchmarking" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg" />
          <span className="font-display font-bold text-xl tracking-tight">Stride.AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/signup"><Button>Get started</Button></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <section className="py-20 md:py-28 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-medium mb-6">
            <Sparkles className="size-3" /> AI Workforce Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-balance leading-[1.05]">
            The employability score that gets you hired.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl text-pretty">
            Stride.AI evaluates your readiness, analyzes live market demand, detects skill gaps, and generates the exact path to your next role.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup"><Button size="lg" className="rounded-xl">Start free assessment</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" className="rounded-xl">I have an account</Button></Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 pb-20">
          {modules.map((m) => (
            <div key={m.title} className="bg-card border border-border rounded-3xl p-6 hover:border-primary/30 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <m.icon className="size-5" />
              </div>
              <h3 className="font-display font-semibold text-lg">{m.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{m.desc}</p>
            </div>
          ))}
        </section>

        <section className="pb-24">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">Built for the entire talent pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {segments.map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <s.icon className="size-5 text-primary mb-3" />
                <div className="font-semibold">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Stride.AI — Employability Intelligence
      </footer>
    </div>
  );
}
