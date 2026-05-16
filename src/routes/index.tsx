import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowRight, Brain, FileText, MessageSquare, Target, Building2, Briefcase,
  ShieldCheck, Lock, Sparkles, CheckCircle2, BarChart3, Zap, Eye, Users,
  GraduationCap, PlayCircle, Star, TrendingUp,
} from "lucide-react";
import heroImg from "@/assets/hero-readiness.jpg";
import analyticsImg from "@/assets/analytics-dashboard.jpg";
import interviewImg from "@/assets/interview-prep.jpg";
import studentsImg from "@/assets/students-learning.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ReadyCheck Lab — AI Career Readiness for Students, Colleges & Recruiters" },
      { name: "description", content: "AI-native career readiness platform. Resume intelligence, mock interviews, role readiness scoring, cohort analytics, and recruiter-grade signals. Free during public beta." },
      { property: "og:title", content: "ReadyCheck Lab — AI Career Readiness Platform" },
      { property: "og:description", content: "Resume intelligence, mock interviews, role readiness, and recruiter signals. Free during public beta." },
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
          description: "AI-native career readiness and employability intelligence platform",
        }),
      },
    ],
  }),
});

const platformPillars = [
  { icon: FileText, title: "Resume Intelligence", desc: "AI parses, scores, and rewrites resumes against your target role — line by line.", href: "/demo" },
  { icon: MessageSquare, title: "Mock Interviews", desc: "Live AI interviewer adapts to your role, gives rubric-based feedback in real time.", href: "/demo" },
  { icon: Target, title: "Role Readiness", desc: "Skill-by-skill readiness score against the actual job market for your target role.", href: "/demo" },
  { icon: BarChart3, title: "Cohort Analytics", desc: "Institutions get placement-grade dashboards across students, roles, and skills.", href: "/solutions" },
  { icon: Briefcase, title: "Recruiter Signals", desc: "Verified readiness signals — not just resumes — so recruiters shortlist faster.", href: "/demo" },
];

const resumeChecks = [
  "ATS parse score & format issues",
  "Role-specific keyword gap analysis",
  "Quantified impact suggestions per bullet",
  "Skills extracted & benchmarked vs. role",
  "AI rewrite for any line you select",
];

const interviewFeatures = [
  { label: "Real-time conversation", desc: "Spoken or typed — AI follows up like a real recruiter." },
  { label: "Rubric-based scoring", desc: "Communication, depth, structure, role fit — scored per answer." },
  { label: "Replayable transcripts", desc: "Every session saved with timestamps and feedback." },
];

const institutionValue = [
  { icon: Users, title: "Cohort dashboards", desc: "Track every student's readiness, top gaps, and improvement over time." },
  { icon: TrendingUp, title: "Placement intelligence", desc: "See which roles your cohort is ready for — and which need uplift." },
  { icon: GraduationCap, title: "Targeted interventions", desc: "Push role-specific learning paths to students who need them most." },
];

const recruiterValue = [
  "Shortlist candidates by verified readiness, not just resume keywords",
  "See assessment scores, interview transcripts, and skill evidence in one view",
  "Run private role-specific assessments for your hiring funnel",
  "Cut top-of-funnel screening time by working from readiness signals",
];

const faqs = [
  { q: "Is ReadyCheck Lab free?", a: "Yes — fully free during public beta. We'll introduce paid plans for advanced features after beta. Early users will get extended free access and grandfathered pricing." },
  { q: "Who is it for?", a: "Students preparing for placements, colleges and institutions running placement programs, and recruiters who want verified readiness signals instead of keyword-matched resumes." },
  { q: "What roles do you support?", a: "Software engineering, data, analytics, product, and business roles today. We're adding more role packs every week — request a role from your dashboard." },
  { q: "How does the AI interview work?", a: "You pick a role, the AI runs a real-time interview adapted to that role, and you get per-answer scoring across communication, depth, structure, and role fit. Sessions are recorded so you can review." },
  { q: "Can institutions use it for full cohorts?", a: "Yes. We provide cohort dashboards, placement intelligence, and bulk onboarding via CSV. Talk to us about an institutional rollout." },
  { q: "How is my data handled?", a: "Resumes, interview transcripts, and scores are encrypted at rest and in transit. We never share your data with recruiters without your explicit consent. See our Security page for details." },
];

const trustSignals = [
  { icon: Lock, title: "Encrypted end-to-end", desc: "TLS in transit, encryption at rest. Session tokens rotated automatically." },
  { icon: ShieldCheck, title: "Row-level security", desc: "Every row scoped to its owner. Recruiters only see what students share." },
  { icon: Eye, title: "Privacy by default", desc: "Your resume and interviews stay private until you choose to share them." },
  { icon: CheckCircle2, title: "Auditable platform", desc: "Admin audit logs, anomaly detection, and per-user data export." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. HERO */}
      <div className="relative text-white" style={{ background: "var(--gradient-hero)" }}>
        <SiteHeader variant="dark" />
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.55_0.22_260)]/30 border border-[oklch(0.72_0.2_250)]/40 text-[11px] font-semibold tracking-wider text-white">
                <Sparkles className="size-3" /> PUBLIC BETA — FREE ACCESS
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-[11px] font-semibold tracking-wider text-white/90">
                AI-NATIVE
              </span>
            </div>
            <h1 className="mt-6 font-display font-bold tracking-tight text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              <span className="text-white">Be career-ready.</span>
              <br />
              <span className="text-[oklch(0.72_0.2_250)]">Provably.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-xl leading-relaxed">
              AI resume intelligence, live mock interviews, and role-by-role readiness scoring —
              built for students, colleges, and recruiters who need real signal, not buzzwords.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="rounded-md bg-[oklch(0.55_0.22_260)] hover:bg-[oklch(0.6_0.22_260)] text-white gap-2 h-12 px-6 text-base">
                  Start free <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="rounded-md bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2 h-12 px-6 text-base">
                  <PlayCircle className="size-4" /> See live demo
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[oklch(0.78_0.18_245)]" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[oklch(0.78_0.18_245)]" /> 60-second signup</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[oklch(0.78_0.18_245)]" /> Google sign-in</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[2.5rem] blur-3xl" style={{ background: "var(--gradient-hero-glow)" }} />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_120px_-20px_oklch(0.5_0.22_260/0.6)]">
              <img
                src={heroImg}
                alt="ReadyCheck Lab AI readiness dashboard"
                width={1024}
                height={1024}
                className="w-full h-auto block"
              />
              <div className="absolute inset-0" style={{ background: "var(--gradient-hero-veil-top)" }} />
            </div>
          </div>
        </section>
      </div>

      {/* Metrics strip */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: "60s", l: "From signup to first AI score" },
            { v: "5", l: "Readiness pillars per role" },
            { v: "Live", l: "AI mock interviews" },
            { v: "Free", l: "During public beta" },
          ].map((m) => (
            <div key={m.l}>
              <div className="font-display font-bold text-3xl text-primary">{m.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. PLATFORM EXPLANATION */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-3">The Platform</Badge>
          <h2 className="font-display font-bold text-3xl md:text-5xl">One platform. Every readiness signal.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Resume, interview, role-fit, and cohort intelligence — connected end-to-end so every score, gap, and improvement compounds.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {platformPillars.map((p) => (
            <Card key={p.title} className="group hover:border-primary/40 transition-colors">
              <CardContent className="p-6">
                <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <p.icon className="size-5" />
                </div>
                <h3 className="font-display font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
                <Link to={p.href} className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:gap-1.5 transition-all">
                  Try the demo <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. AI RESUME INTELLIGENCE */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="secondary" className="mb-3"><FileText className="size-3 mr-1" /> Resume Intelligence</Badge>
            <h2 className="font-display font-bold text-3xl md:text-4xl">Your resume, line-by-line, scored by AI.</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Upload once. Get an ATS-grade parse, role-specific gap analysis, and one-click AI rewrites for every weak bullet.
            </p>
            <ul className="mt-6 space-y-3">
              {resumeChecks.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" className="gap-2">Upload your resume <ArrowRight className="size-4" /></Button></Link>
              <Link to="/demo"><Button size="lg" variant="outline" className="gap-2"><PlayCircle className="size-4" /> See sample report</Button></Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
              <img src={analyticsImg} alt="AI resume scoring dashboard" loading="lazy" width={1024} height={1024} className="w-full h-auto block" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOCK INTERVIEW SHOWCASE */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
            <img src={interviewImg} alt="Live AI mock interview session" loading="lazy" width={1024} height={1024} className="w-full h-auto block" />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Badge variant="secondary" className="mb-3"><MessageSquare className="size-3 mr-1" /> Mock Interviews</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl">Practice with an interviewer that adapts to you.</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Pick a role. The AI runs a live, conversational interview — follow-up questions, rubric scoring, replayable transcripts.
          </p>
          <div className="mt-6 space-y-4">
            {interviewFeatures.map((f) => (
              <div key={f.label} className="flex gap-4">
                <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Zap className="size-4" />
                </div>
                <div>
                  <div className="font-semibold">{f.label}</div>
                  <div className="text-sm text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup"><Button size="lg" className="gap-2">Start a mock interview <ArrowRight className="size-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* 5. ROLE READINESS */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-3"><Target className="size-3 mr-1" /> Role Readiness</Badge>
            <h2 className="font-display font-bold text-3xl md:text-5xl">Know exactly where you stand for your target role.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A single readiness score broken down across five pillars, with a personalised learning path to close every gap.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-3">
            {["Technical Skills", "Communication", "Problem Solving", "Role Knowledge", "Interview Presence"].map((pillar, i) => (
              <div key={pillar} className="bg-card border border-border rounded-xl p-5 text-center">
                <div className="text-xs font-mono text-primary">PILLAR {i + 1}</div>
                <div className="mt-2 font-semibold">{pillar}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/demo"><Button size="lg" variant="outline" className="gap-2"><PlayCircle className="size-4" /> See a sample readiness report</Button></Link>
          </div>
        </div>
      </section>

      {/* 6. INSTITUTION ANALYTICS */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="secondary" className="mb-3"><Building2 className="size-3 mr-1" /> For Institutions</Badge>
            <h2 className="font-display font-bold text-3xl md:text-4xl">Placement-grade analytics for your entire cohort.</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Colleges and training programs get a real-time view of every student's readiness, top skill gaps, and improvement curves — without spreadsheets.
            </p>
            <div className="mt-6 grid sm:grid-cols-1 gap-4">
              {institutionValue.map((v) => (
                <div key={v.title} className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                  <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                    <v.icon className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{v.title}</div>
                    <div className="text-sm text-muted-foreground">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button size="lg" className="gap-2">Book an institutional demo <ArrowRight className="size-4" /></Button></Link>
              <Link to="/solutions"><Button size="lg" variant="outline">Solutions for colleges</Button></Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img src={studentsImg} alt="Institution cohort analytics" loading="lazy" width={1024} height={1024} className="w-full h-auto block" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. RECRUITER CTA */}
      <section className="relative overflow-hidden text-white" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3">
            <Badge className="mb-3 bg-white/10 text-white border-white/20 hover:bg-white/15"><Briefcase className="size-3 mr-1" /> For Recruiters</Badge>
            <h2 className="font-display font-bold text-3xl md:text-4xl">Shortlist on verified readiness — not keyword luck.</h2>
            <p className="mt-4 text-white/75 text-lg leading-relaxed max-w-2xl">
              Move past keyword-matched resumes. See actual readiness scores, interview transcripts, and skill evidence — for every candidate you consider.
            </p>
            <ul className="mt-6 space-y-3">
              {recruiterValue.map((v) => (
                <li key={v} className="flex items-start gap-3 text-sm text-white/85">
                  <CheckCircle2 className="size-5 text-[oklch(0.78_0.18_245)] shrink-0 mt-0.5" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button size="lg" className="bg-white text-[oklch(0.18_0.08_265)] hover:bg-white/90 gap-2">Book a recruiter demo <ArrowRight className="size-4" /></Button></Link>
              <Link to="/demo"><Button size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2"><PlayCircle className="size-4" /> See sample candidates</Button></Link>
            </div>
          </div>
          <div className="lg:col-span-2 grid gap-3">
            {[
              { v: "Faster", l: "top-of-funnel screening" },
              { v: "Verified", l: "scores, not self-claims" },
              { v: "Private", l: "candidates opt-in to share" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                <div className="font-display font-bold text-2xl text-[oklch(0.78_0.18_245)]">{s.v}</div>
                <div className="text-sm text-white/70 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS PLACEHOLDER */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-3">Public Beta</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl">Early users are shaping the product.</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            We're onboarding our first cohort of students, colleges, and recruiters. Be one of them — your feedback shapes what ships next.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { role: "Student", quote: "Join the first cohort and share your story.", icon: GraduationCap },
            { role: "College", quote: "Pilot ReadyCheck Lab with your cohort this term.", icon: Building2 },
            { role: "Recruiter", quote: "Pilot the recruiter dashboard with your hiring team.", icon: Briefcase },
          ].map((t) => (
            <Card key={t.role} className="border-dashed">
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-primary mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-4" />)}
                </div>
                <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
                  <t.icon className="size-4" /> {t.role.toUpperCase()} — JOIN THE BETA
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 9. PRICING PREVIEW */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-3">Pricing</Badge>
            <h2 className="font-display font-bold text-3xl md:text-5xl">Free during public beta.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every feature is unlocked for beta users. Paid plans go live after beta — early users get extended free access and grandfathered pricing.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { name: "Student", price: "Free", note: "during beta", features: ["AI resume scoring", "Mock interviews", "Role readiness score", "Personalised learning path"] },
              { name: "Premium", price: "Free", note: "during beta", features: ["Everything in Student", "Unlimited mock interviews", "Deep analytics", "Priority AI rewrites"], featured: true },
              { name: "Institution", price: "Custom", note: "talk to us", features: ["Cohort dashboards", "Bulk onboarding", "Placement intelligence", "Dedicated success manager"] },
            ].map((p) => (
              <Card key={p.name} className={p.featured ? "border-primary shadow-lg relative" : ""}>
                {p.featured && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>}
                <CardContent className="p-6">
                  <div className="font-display font-semibold text-lg">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.note}</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={p.name === "Institution" ? "/contact" : "/signup"} className="block mt-6">
                    <Button className="w-full" variant={p.featured ? "default" : "outline"}>
                      {p.name === "Institution" ? "Talk to us" : "Start free"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              See full pricing details <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3">FAQ</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl">Common questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 11. SECURITY & TRUST */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-3"><ShieldCheck className="size-3 mr-1" /> Security & Trust</Badge>
            <h2 className="font-display font-bold text-3xl md:text-4xl">Built with security at the core.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your resume, interview transcripts, and scores belong to you. Nothing is shared without your explicit consent.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustSignals.map((t) => (
              <Card key={t.title}>
                <CardContent className="p-6">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                    <t.icon className="size-5" />
                  </div>
                  <div className="font-semibold">{t.title}</div>
                  <p className="text-sm text-muted-foreground mt-2">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/security"><Button variant="outline" className="gap-2">Read our security overview <ArrowRight className="size-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="rounded-3xl p-10 md:p-16 text-white text-center relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-hero-glow)" }} />
          <div className="relative">
            <Brain className="size-12 mx-auto text-[oklch(0.78_0.18_245)]" />
            <h2 className="font-display font-bold text-3xl md:text-5xl mt-5">Be the candidate recruiters can verify.</h2>
            <p className="text-white/80 mt-4 max-w-xl mx-auto text-lg">
              Free during public beta. 60 seconds to your first AI-graded readiness score.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-[oklch(0.18_0.08_265)] hover:bg-white/90 gap-2 h-12 px-6 text-base">
                  Start free <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2 h-12 px-6 text-base">
                  <PlayCircle className="size-4" /> Watch the demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
