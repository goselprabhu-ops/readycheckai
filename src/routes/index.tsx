import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Crosshair, Globe2, Landmark, LineChart, ShieldCheck, Users } from "lucide-react";
import logo from "@/assets/logo-readycheck.png";

export const Route = createFileRoute("/")({
  component: Index,
});

const features = [
  { icon: Crosshair, title: "Measure Readiness", desc: "Advanced assessments and analytics to measure skills, knowledge, and potential." },
  { icon: BookOpen, title: "Personalized Learning", desc: "AI-driven learning paths adapted to individual strengths and gaps." },
  { icon: LineChart, title: "Actionable Insights", desc: "Real-time dashboards and reports for data-driven decisions." },
  { icon: Users, title: "Institutional Impact", desc: "Empowering institutions with intelligence to improve outcomes at scale." },
  { icon: ShieldCheck, title: "Secure & Reliable", desc: "Enterprise-grade security ensuring data privacy and reliability." },
];

const stats = [
  { icon: Users, value: "100K+", label: "Learners Impacted" },
  { icon: Landmark, value: "500+", label: "Institutions" },
  { icon: LineChart, value: "10M+", label: "Assessments Completed" },
  { icon: Globe2, value: "25+", label: "Countries" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero with deep gradient */}
      <div
        className="relative text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="ReadyCheck Lab logo" className="h-12 w-auto" />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-display font-bold text-xl tracking-tight">
                ReadyCheck <span className="text-[oklch(0.78_0.18_245)]">Lab</span>
              </span>
              <span className="text-[11px] text-white/70 tracking-wide">Measure. Learn. Improve.</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/80">
            <a href="#home" className="text-white border-b-2 border-white/80 pb-0.5">Home</a>
            <a href="#solutions" className="hover:text-white">Solutions</a>
            <a href="#products" className="hover:text-white">Products</a>
            <a href="#research" className="hover:text-white">Research</a>
            <a href="#about" className="hover:text-white">About Us</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button className="rounded-md bg-[oklch(0.6_0.22_255)] hover:bg-[oklch(0.65_0.22_255)] text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </header>

        <section id="home" className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-md border border-white/20 bg-white/5 text-[11px] font-semibold tracking-wider text-white/90">
              AI-POWERED READINESS INTELLIGENCE
            </span>
            <h1 className="mt-6 font-display font-bold tracking-tight text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              <span className="text-white">Measure. </span>
              <span className="text-[oklch(0.72_0.2_250)]">Learn. </span>
              <span className="text-[oklch(0.72_0.2_250)]">Improve.</span>
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-xl">
              ReadyCheck Lab is an AI-powered platform that measures readiness, drives personalized learning, and delivers actionable insights for continuous improvement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="rounded-md bg-[oklch(0.5_0.22_260)] hover:bg-[oklch(0.55_0.22_260)] text-white gap-2">
                  Explore Solutions <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="rounded-md bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2">
                  Learn More <ArrowRight className="size-4" />
                </Button>
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[oklch(0.55_0.22_260)/0.25] to-transparent blur-3xl" />
            <div className="relative aspect-square rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,oklch(0.45_0.22_260)/0.4,transparent_70%)] flex items-center justify-center">
              <div className="size-2/3 rounded-full border border-white/15 grid place-items-center">
                <div className="size-1/2 rounded-full bg-gradient-to-br from-[oklch(0.7_0.2_245)] to-[oklch(0.45_0.22_265)] shadow-[0_0_120px_oklch(0.6_0.22_255)/0.6]" />
              </div>
              <div className="absolute top-6 left-6 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                <LineChart className="size-6 text-[oklch(0.78_0.18_245)]" />
              </div>
              <div className="absolute bottom-10 right-6 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                <Crosshair className="size-6 text-[oklch(0.78_0.18_245)]" />
              </div>
              <div className="absolute top-1/2 right-2 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                <ShieldCheck className="size-6 text-[oklch(0.78_0.18_245)]" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:divide-x divide-border">
          {features.map((f) => (
            <div key={f.title} className="px-2 md:px-6 text-center">
              <div className="mx-auto size-12 grid place-items-center text-primary mb-4">
                <f.icon className="size-8" strokeWidth={2} />
              </div>
              <h3 className="font-display font-bold text-base">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-card border border-border rounded-2xl shadow-sm px-6 md:px-10 py-8 grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <s.icon className="size-8 text-primary shrink-0" strokeWidth={1.8} />
              <div>
                <div className="font-display font-bold text-2xl text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
          <div className="hidden md:block text-sm text-muted-foreground">
            Trusted by Educators,<br />Institutions &amp; Learners<br />Worldwide
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ReadyCheck Lab — Measure. Learn. Improve.
      </footer>
    </div>
  );
}
