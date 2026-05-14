import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowRight, BookOpen, Brain, Crosshair, Globe2, GraduationCap,
  Landmark, LineChart, Network, ShieldCheck, Sparkles, Target, TrendingUp, Users,
} from "lucide-react";
import heroImg from "@/assets/hero-readiness.jpg";
import studentsImg from "@/assets/students-learning.jpg";
import analyticsImg from "@/assets/analytics-dashboard.jpg";
import networkImg from "@/assets/ai-network.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ReadyCheck Lab — AI Career Readiness for Students & Recruiters" },
      { name: "description", content: "Measure SQL, Python and resume readiness with AI. Personalized roadmaps, mock interviews, and analytics for students, colleges and recruiters." },
      { property: "og:title", content: "ReadyCheck Lab — AI Career Readiness" },
      { property: "og:description", content: "Measure SQL, Python and resume readiness with AI. Personalized roadmaps and analytics for students, colleges and recruiters." },
      { property: "og:url", content: "https://readycheckai.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://readycheckai.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ReadyCheck Lab",
          url: "https://readycheckai.lovable.app",
          description: "AI-powered employability intelligence platform",
        }),
      },
    ],
  }),
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

const philosophy = [
  { word: "Measure", color: "oklch(0.78_0.18_245)", desc: "Understand current readiness with precision diagnostics." },
  { word: "Learn", color: "oklch(0.7_0.2_250)", desc: "Enable intelligent improvement through adaptive pathways." },
  { word: "Improve", color: "oklch(0.6_0.22_255)", desc: "Achieve measurable growth outcomes that compound over time." },
];

const positioning = [
  { icon: Brain, label: "Artificial Intelligence" },
  { icon: GraduationCap, label: "Educational Technology" },
  { icon: Target, label: "Readiness Analytics" },
  { icon: Sparkles, label: "Adaptive Learning" },
  { icon: TrendingUp, label: "Skill Intelligence" },
];

const futureScope = [
  "Student readiness scoring",
  "AI-powered assessments",
  "Interview & career readiness",
  "Institutional analytics",
  "Government education initiatives",
  "Workforce readiness intelligence",
  "Smart learning ecosystems",
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero with deep gradient */}
      <div className="relative text-white" style={{ background: "var(--gradient-hero)" }}>
        <SiteHeader variant="dark" />

        <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-center">
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
              ReadyCheck Lab is an innovation-driven platform transforming how learners,
              educators, institutions, and organizations measure readiness, identify growth
              opportunities, and achieve continuous improvement through intelligent technology.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="rounded-md bg-[oklch(0.5_0.22_260)] hover:bg-[oklch(0.55_0.22_260)] text-white gap-2">
                  Explore Solutions <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="rounded-md bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2">
                  Learn More <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[oklch(0.55_0.22_260)/0.35] to-transparent blur-3xl" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_120px_-20px_oklch(0.5_0.22_260/0.6)]">
              <img
                src={heroImg}
                alt="AI readiness intelligence visualization"
                width={1024}
                height={1024}
                className="w-full h-auto block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.08_265)/0.6] via-transparent to-transparent" />
            </div>
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold tracking-wider text-primary">CAPABILITIES</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-2">A platform built for readiness</h2>
        </div>
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

      {/* Vision + Mission */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
            <img src={studentsImg} alt="Students collaborating with AI readiness dashboards" loading="lazy" width={1024} height={1024} className="w-full h-auto block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.08_265)/0.5] via-transparent to-transparent" />
          </div>
          <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <span className="text-xs font-semibold tracking-wider text-primary">CORE VISION</span>
            <h3 className="font-display font-bold text-2xl mt-3 leading-snug">
              A future where every learner and institution understands their readiness, improves with precision, and grows with confidence.
            </h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <span className="text-xs font-semibold tracking-wider text-primary">CORE MISSION</span>
            <h3 className="font-display font-bold text-xl mt-3">Develop intelligent systems that:</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {["Measure learning and skill readiness",
                "Personalize improvement pathways",
                "Deliver actionable educational insights",
                "Support data-driven growth for students and institutions"].map((m) => (
                <li key={m} className="flex gap-2"><span className="text-primary">→</span>{m}</li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </section>

      {/* Brand Philosophy */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-wider text-primary">BRAND PHILOSOPHY</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-2">Three words. One operating model.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {philosophy.map((p, i) => (
            <div key={p.word} className="relative bg-card border border-border rounded-2xl p-8 overflow-hidden">
              <div className="absolute -top-4 -right-4 text-[7rem] font-display font-bold text-muted/30 leading-none select-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="font-display font-bold text-3xl" style={{ color: `oklch(${p.color.replaceAll("_", " ")})` }}>
                {p.word}
              </div>
              <p className="mt-3 text-sm text-muted-foreground relative">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Positioning */}
      <section className="relative bg-[oklch(0.18_0.08_265)] text-white overflow-hidden">
        <img src={networkImg} alt="" aria-hidden loading="lazy" width={1024} height={1024} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.18_0.08_265)/0.85] via-[oklch(0.18_0.08_265)/0.7] to-[oklch(0.18_0.08_265)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-wider text-[oklch(0.78_0.18_245)]">POSITIONING</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-2">At the intersection of five disciplines</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {positioning.map((p) => (
              <div key={p.label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center backdrop-blur-sm">
                <p.icon className="size-7 mx-auto text-[oklch(0.78_0.18_245)]" strokeWidth={1.8} />
                <div className="mt-3 text-sm font-medium">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <span className="text-xs font-semibold tracking-wider text-primary">FUTURE SCOPE</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-2">Built to expand with you</h2>
            <p className="text-muted-foreground mt-4">
              The platform grows with the readiness ecosystem — from individual learners
              to institutions, employers, and governments.
            </p>
            <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-md">
              <img src={analyticsImg} alt="Analytics dashboard preview" loading="lazy" width={1024} height={1024} className="w-full h-auto block" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 order-1 lg:order-2">
            {futureScope.map((s, i) => (
              <div key={s} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                <span className="font-mono text-xs text-primary mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
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

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl p-10 md:p-14 text-white text-center" style={{ background: "var(--gradient-hero)" }}>
          <Network className="size-10 mx-auto text-[oklch(0.78_0.18_245)]" />
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">Ready to measure what matters?</h2>
          <p className="text-white/75 mt-3 max-w-xl mx-auto">
            Join the readiness intelligence movement. Start with a free assessment today.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-[oklch(0.18_0.08_265)] hover:bg-white/90 gap-2">
                Get Started <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                Talk to us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
