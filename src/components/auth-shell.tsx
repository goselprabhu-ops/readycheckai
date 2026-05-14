import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.28 0.13 265) 0%, oklch(0.38 0.18 262) 45%, oklch(0.55 0.22 260) 100%)",
          }}
        />
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[26rem] h-[26rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5" />
            ReadyCheck Lab
          </Link>
        </div>

        <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Measure. Learn. Improve.
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Career readiness for aspiring Data Analysts — assessments, resume analysis, and a personalized roadmap.
          </p>
          <ul className="space-y-2 text-white/90 text-sm">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" /> SQL & Python skill assessments</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" /> AI-powered resume analysis</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Track readiness over time</li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} ReadyCheck Lab
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="lg:hidden mb-6 flex items-center gap-2 font-display text-lg font-bold text-primary">
            <Sparkles className="h-5 w-5" />
            ReadyCheck Lab
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}