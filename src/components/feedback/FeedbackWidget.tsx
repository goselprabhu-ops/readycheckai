import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ThumbsUp, ThumbsDown, MessageSquarePlus, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { submitFeedback, type FeedbackSurface } from "@/lib/feedback.functions";

interface Props {
  surface: FeedbackSurface;
  entityId?: string | null;
  feature?: string;
  model?: string;
  className?: string;
  /** Compact = just thumbs + "report" link; Full = label + thumbs. */
  variant?: "compact" | "full";
  label?: string;
}

const ISSUE_TAGS: Record<FeedbackSurface, { value: string; label: string }[]> = {
  resume: [
    { value: "wrong_facts", label: "Got facts wrong" },
    { value: "missed_skills", label: "Missed skills" },
    { value: "low_quality_rewrite", label: "Low-quality rewrite" },
    { value: "ats_score_off", label: "ATS score feels off" },
    { value: "other", label: "Other" },
  ],
  recommendation: [
    { value: "not_relevant", label: "Not relevant to me" },
    { value: "already_done", label: "Already completed" },
    { value: "too_generic", label: "Too generic" },
    { value: "broken_link", label: "Broken / bad link" },
    { value: "other", label: "Other" },
  ],
  interview: [
    { value: "wrong_evaluation", label: "Wrong evaluation" },
    { value: "off_topic_question", label: "Off-topic question" },
    { value: "too_easy", label: "Too easy" },
    { value: "too_hard", label: "Too hard" },
    { value: "feedback_unclear", label: "Feedback unclear" },
    { value: "other", label: "Other" },
  ],
  assessment: [
    { value: "wrong_answer_key", label: "Wrong answer key" },
    { value: "ambiguous_question", label: "Ambiguous question" },
    { value: "too_easy", label: "Too easy" },
    { value: "too_hard", label: "Too hard" },
    { value: "off_topic", label: "Off the role" },
    { value: "other", label: "Other" },
  ],
  roadmap: [
    { value: "irrelevant_task", label: "Task isn't useful" },
    { value: "wrong_order", label: "Wrong sequencing" },
    { value: "duration_off", label: "Time estimate off" },
    { value: "missing_topic", label: "Missing topic" },
    { value: "other", label: "Other" },
  ],
  other: [{ value: "other", label: "Other" }],
};

/**
 * Premium feedback control. Inline thumbs up/down for a quick signal,
 * plus a "Report issue" dialog for negative signals or detailed comments.
 * Optimistic UI + analytics tracking; non-blocking on failure.
 */
export function FeedbackWidget({
  surface,
  entityId = null,
  feature,
  model,
  className,
  variant = "compact",
  label = "Was this helpful?",
}: Props) {
  const submit = useServerFn(submitFeedback);
  const [submitted, setSubmitted] = useState<null | 1 | -1>(null);
  const [open, setOpen] = useState(false);
  const [issueTag, setIssueTag] = useState<string>("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (rating: 1 | -1, extras?: { issueTag?: string; comment?: string }) => {
    setSubmitted(rating);
    void track("feedback_submitted", {
      properties: { surface, rating, has_comment: Boolean(extras?.comment) },
    });
    try {
      await submit({
        data: {
          surface,
          rating,
          entityId,
          feature,
          model,
          issueTag: extras?.issueTag ?? null,
          comment: extras?.comment ?? null,
        },
      });
    } catch {
      // swallow — feedback must never block the user
    }
  };

  const onThumbsUp = async () => {
    if (submitted) return;
    await send(1);
    toast.success("Thanks — noted.");
  };

  const submitIssue = async () => {
    if (!issueTag && !comment.trim()) {
      toast.error("Pick an issue or add a comment");
      return;
    }
    setBusy(true);
    try {
      await send(-1, { issueTag: issueTag || undefined, comment: comment.trim() || undefined });
      toast.success("Thanks — this helps us improve.");
      setOpen(false);
      setComment("");
      setIssueTag("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      {variant === "full" ? <span>{label}</span> : null}
      <div className="inline-flex items-center rounded-full border border-border/70 bg-card/60 backdrop-blur px-0.5 py-0.5">
        <button
          type="button"
          aria-label="Helpful"
          disabled={submitted !== null}
          onClick={onThumbsUp}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            submitted === 1
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            submitted !== null && submitted !== 1 && "opacity-40",
          )}
        >
          {submitted === 1 ? <Check className="h-3.5 w-3.5" /> : <ThumbsUp className="h-3.5 w-3.5" />}
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Report issue"
              disabled={submitted !== null && submitted !== -1}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                submitted === -1
                  ? "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                submitted !== null && submitted !== -1 && "opacity-40",
              )}
            >
              {submitted === -1 ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ThumbsDown className="h-3.5 w-3.5" />
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display tracking-tight">Report an issue</DialogTitle>
              <DialogDescription>
                Help us improve this output. Your feedback goes straight to the quality team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>What went wrong?</Label>
                <Select value={issueTag} onValueChange={setIssueTag}>
                  <SelectTrigger><SelectValue placeholder="Pick a reason" /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_TAGS[surface].map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-comment">Additional detail (optional)</Label>
                <Textarea
                  id="fb-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                  placeholder="What did you expect to see instead?"
                  rows={4}
                  maxLength={2000}
                />
                <div className="text-[10px] text-muted-foreground text-right">
                  {comment.length}/2000
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={submitIssue} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquarePlus className="h-4 w-4 mr-2" />}
                Send feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {submitted !== null ? (
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Recorded</span>
      ) : null}
    </div>
  );
}