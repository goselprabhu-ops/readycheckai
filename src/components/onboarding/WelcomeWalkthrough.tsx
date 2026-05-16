import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "@/lib/motion";
import { Sparkles, FileText, Target, MessageSquare, Rocket } from "lucide-react";
import { track } from "@/lib/analytics";

const FLAG = "rcl_walkthrough_seen_v1";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to ReadyCheck Lab",
    body: "We help you measure, learn, and improve career readiness — backed by AI and live market signal. Here's a 30-second tour.",
  },
  {
    icon: FileText,
    title: "Resume + AI analysis",
    body: "Upload your resume once. We extract your profile, score it against ATS systems, and detect every skill we can find.",
  },
  {
    icon: Target,
    title: "Readiness score",
    body: "Your composite score blends resume quality, skill assessments, and market fit. It updates as you grow — watch the trend, not the snapshot.",
  },
  {
    icon: Rocket,
    title: "Adaptive roadmap",
    body: "We generate a step-by-step plan to close your gaps. Each task is sized in minutes — you can mark progress as you go.",
  },
  {
    icon: MessageSquare,
    title: "Mock interviews",
    body: "Practice with an AI interviewer on real role-specific questions. Get structured feedback after every session.",
  },
];

/**
 * First-run walkthrough. Opens once per browser based on a localStorage flag,
 * unless `force` is true.
 */
export function WelcomeWalkthrough({ force = false }: { force?: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(FLAG);
    if (force || !seen) {
      setOpen(true);
      void track("walkthrough_started");
    }
  }, [force]);

  const close = (completed: boolean) => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FLAG, "1");
    }
    void track(completed ? "walkthrough_completed" : "walkthrough_skipped", {
      properties: { last_step: step },
    });
  };

  const isLast = step === STEPS.length - 1;
  const Current = STEPS[step].icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(false); }}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 border-border/70">
        <div className="relative">
          <div
            className="absolute inset-x-0 top-0 h-32"
            style={{ background: "var(--gradient-panel)" }}
            aria-hidden
          />
          <div className="relative px-6 pt-6 pb-2">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
              <Current className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {STEPS[step].title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {STEPS[step].body}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5" aria-label="Progress">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === step ? "w-6 bg-primary" : "w-1.5 bg-muted")
                  }
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => close(false)}
                className="text-muted-foreground"
              >
                Skip
              </Button>
              {step > 0 ? (
                <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : null}
              <Button
                size="sm"
                onClick={() => (isLast ? close(true) : setStep(step + 1))}
              >
                {isLast ? "Get started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}