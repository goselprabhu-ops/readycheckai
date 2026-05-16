import { toast } from "sonner";
import { track } from "@/lib/analytics";

const KEY = "rcl_milestones_v1";

function read(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(m: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* noop */
  }
}

export type MilestoneId =
  | "profile_complete"
  | "role_selected"
  | "resume_analyzed"
  | "first_assessment"
  | "readiness_computed"
  | "roadmap_generated"
  | "first_interview";

const COPY: Record<MilestoneId, { title: string; description: string; emoji: string }> = {
  profile_complete: {
    emoji: "🎯",
    title: "Profile complete",
    description: "Recruiters and AI now have a full picture of you.",
  },
  role_selected: {
    emoji: "🧭",
    title: "Target role locked in",
    description: "We'll tailor recommendations to this path.",
  },
  resume_analyzed: {
    emoji: "📄",
    title: "Resume analyzed",
    description: "Your ATS score and skill map are ready.",
  },
  first_assessment: {
    emoji: "🧠",
    title: "First assessment done",
    description: "Great start — your readiness just got smarter.",
  },
  readiness_computed: {
    emoji: "✨",
    title: "Readiness score live",
    description: "Track this over time as you improve.",
  },
  roadmap_generated: {
    emoji: "🛠",
    title: "Roadmap generated",
    description: "A personalized plan is waiting for you.",
  },
  first_interview: {
    emoji: "🎤",
    title: "First mock interview",
    description: "Real practice — that confidence will compound.",
  },
};

/**
 * Fire a celebratory toast once per user/browser for a given milestone.
 * Safe to call repeatedly — dedupes via localStorage.
 */
export function celebrate(id: MilestoneId) {
  const m = read();
  if (m[id]) return;
  m[id] = Date.now();
  write(m);

  const c = COPY[id];
  toast.success(`${c.emoji}  ${c.title}`, {
    description: c.description,
    duration: 4500,
  });
  void track("milestone_reached", { properties: { milestone: id } });
}

export function hasCelebrated(id: MilestoneId): boolean {
  return Boolean(read()[id]);
}