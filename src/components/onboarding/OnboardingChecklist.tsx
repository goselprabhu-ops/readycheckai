import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "@/lib/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { profileCompletion } from "@/lib/profile-completion";
import { celebrate } from "./milestones";

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

const DISMISS_KEY = "rcl_checklist_dismissed_v1";

/**
 * Premium onboarding checklist surfaced on the dashboard until the user
 * has activated the core surfaces. Self-fetches its own data so any page
 * can mount it without prop wiring.
 */
export function OnboardingChecklist() {
  const fetchProfile = useServerFn(getMyProfile);
  const [profile, setProfile] = useState<any>(null);
  const [resumeCount, setResumeCount] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [readinessCount, setReadinessCount] = useState(0);
  const [roadmapCount, setRoadmapCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(DISMISS_KEY));
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, r, a, e, rm, iv] = await Promise.all([
        fetchProfile().catch(() => ({ profile: null })),
        supabase.from("resume_analyses").select("id", { count: "exact", head: true }),
        supabase.from("assessments").select("id", { count: "exact", head: true }),
        supabase.from("employability_scores").select("id", { count: "exact", head: true }),
        supabase.from("roadmap_items").select("id", { count: "exact", head: true }),
        supabase.from("interview_sessions").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      setProfile((p as any).profile ?? null);
      setResumeCount(r.count ?? 0);
      setAssessmentCount(a.count ?? 0);
      setReadinessCount(e.count ?? 0);
      setRoadmapCount(rm.count ?? 0);
      setInterviewCount(iv.count ?? 0);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  const completion = useMemo(() => profileCompletion(profile), [profile]);

  const steps: Step[] = useMemo(
    () => [
      {
        id: "profile",
        title: "Complete your profile",
        description: "Fill in your contact, education, and experience. Hit 80% to unlock recruiter visibility.",
        href: "/profile",
        cta: completion >= 80 ? "Polish profile" : "Continue profile",
        done: completion >= 80,
      },
      {
        id: "role",
        title: "Pick a target role",
        description: "We tailor assessments, roadmap, and interviews to this role.",
        href: "/onboarding",
        cta: "Choose role",
        done: Boolean(profile?.target_role),
      },
      {
        id: "resume",
        title: "Upload & analyze your resume",
        description: "Get an ATS score, gap analysis, and detected skills.",
        href: "/resume",
        cta: "Open resume tools",
        done: resumeCount > 0,
      },
      {
        id: "assessment",
        title: "Take your first assessment",
        description: "A short skill test calibrates your real readiness — not a guess.",
        href: "/assessment",
        cta: "Start assessment",
        done: assessmentCount > 0,
      },
      {
        id: "readiness",
        title: "See your readiness score",
        description: "Compute your composite score to start tracking trend over time.",
        href: "/dashboard",
        cta: "View readiness",
        done: readinessCount > 0,
      },
      {
        id: "roadmap",
        title: "Generate your roadmap",
        description: "A personalized step-by-step plan to close every gap.",
        href: "/roadmap",
        cta: "Generate roadmap",
        done: roadmapCount > 0,
      },
      {
        id: "interview",
        title: "Run a mock interview",
        description: "Practice live with an AI interviewer and get structured feedback.",
        href: "/interview",
        cta: "Try interview",
        done: interviewCount > 0,
      },
    ],
    [completion, profile?.target_role, resumeCount, assessmentCount, readinessCount, roadmapCount, interviewCount],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((doneCount / total) * 100);

  // Celebrate milestones as they cross.
  useEffect(() => {
    if (!loaded) return;
    if (completion >= 80) celebrate("profile_complete");
    if (profile?.target_role) celebrate("role_selected");
    if (resumeCount > 0) celebrate("resume_analyzed");
    if (assessmentCount > 0) celebrate("first_assessment");
    if (readinessCount > 0) celebrate("readiness_computed");
    if (roadmapCount > 0) celebrate("roadmap_generated");
    if (interviewCount > 0) celebrate("first_interview");
  }, [loaded, completion, profile?.target_role, resumeCount, assessmentCount, readinessCount, roadmapCount, interviewCount]);

  // Hide entirely once everything is done OR user explicitly dismissed.
  if (!loaded || dismissed || doneCount === total) return null;

  const nextStep = steps.find((s) => !s.done);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDismissed(true);
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="relative">
        <div
          className="absolute inset-x-0 top-0 h-20 opacity-90"
          style={{ background: "var(--gradient-panel)" }}
          aria-hidden
        />
        <CardContent className="relative p-5 pt-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-white/25">
                <Sparkles className="h-3 w-3" /> Getting started
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold tracking-tight">
                You're {pct}% set up
              </h2>
              <p className="text-sm text-white/80">
                {doneCount} of {total} done — keep the momentum going.
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss checklist"
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Progress value={pct} className="mt-3 h-1.5 bg-white/20" />
        </CardContent>
      </div>

      <div className="p-3 sm:p-4 space-y-1.5">
        <AnimatePresence initial={false}>
          {steps.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                s.done
                  ? "bg-muted/40"
                  : nextStep?.id === s.id
                    ? "bg-primary/5 ring-1 ring-primary/20"
                    : "hover:bg-muted/40",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  s.done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground ring-1 ring-border",
                )}
                aria-hidden
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-medium tracking-tight",
                      s.done && "line-through text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </h3>
                  {nextStep?.id === s.id ? (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                      Next
                    </span>
                  ) : null}
                </div>
                {!s.done ? (
                  <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                ) : null}
              </div>
              {!s.done ? (
                <Button asChild size="sm" variant={nextStep?.id === s.id ? "default" : "ghost"} className="rounded-lg">
                  <Link to={s.href}>
                    {s.cta}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}