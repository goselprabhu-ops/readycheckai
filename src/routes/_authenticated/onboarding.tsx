import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "@/lib/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  registerResumeUpload,
  extractResumeText,
} from "@/lib/resume.functions";
import { parseResumeForProfile, updateMyProfile, getMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";
import { FileText, UserPlus, Sparkles, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
import { celebrate } from "@/components/onboarding/milestones";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const nav = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const registerUpload = useServerFn(registerResumeUpload);
  const extractText = useServerFn(extractResumeText);
  const parseResume = useServerFn(parseResumeForProfile);
  const saveProfile = useServerFn(updateMyProfile);

  const [stage, setStage] = useState<
    "role" | "choose" | "uploading" | "extracting" | "parsing" | "saving" | "done"
  >("role");
  const [progress, setProgress] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [savingRole, setSavingRole] = useState(false);

  // Skip onboarding if already done
  useEffect(() => {
    fetchProfile().then(({ profile }) => {
      const p = profile as any;
      if (p?.onboarded) {
        nav({ to: "/profile" });
        return;
      }
      if (p?.target_role) {
        setSelectedRole(p.target_role);
        setStage("choose");
      }
    });
    void track("onboarding_started");
  }, []);

  const handleRoleNext = async () => {
    if (!selectedRole) {
      toast.error("Pick a target role to continue");
      return;
    }
    setSavingRole(true);
    try {
      await saveProfile({ data: { target_role: selectedRole } });
      celebrate("role_selected");
      void track("onboarding_role_selected", { properties: { role: selectedRole } });
      setStage("choose");
    } catch (e: any) {
      toast.error(e?.message || "Could not save role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleResume = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Please upload a PDF");
    if (file.size > 10 * 1024 * 1024) return toast.error("PDF must be under 10MB");

    try {
      setStage("uploading");
      setProgress(15);
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (upErr) throw upErr;
      setProgress(35);
      await registerUpload({ data: { filePath: path, originalName: file.name } });

      setStage("extracting");
      setProgress(55);
      const ext = await extractText({ data: { filePath: path } });
      if (!ext.text || ext.status !== "ok") {
        throw new Error(
          (ext as any).message ?? "Could not extract text from this PDF",
        );
      }
      const text = ext.text;

      setStage("parsing");
      setProgress(75);
      const { extracted } = await parseResume({ data: { text } });

      setStage("saving");
      setProgress(90);
      // Save into profile (don't mark onboarded yet — let the user review)
      const ed = (extracted ?? {}) as any;
      await saveProfile({
        data: {
          full_name: ed.full_name || undefined,
          headline: ed.headline || undefined,
          phone: ed.phone || undefined,
          location: ed.location || undefined,
          summary: ed.summary || undefined,
          linkedin_url: ed.linkedin_url || undefined,
          github_url: ed.github_url || undefined,
          portfolio_url: ed.portfolio_url || undefined,
          college: ed.college || undefined,
          year: ed.year || undefined,
          target_role: ed.target_role || undefined,
          education: ed.education ?? [],
          experience: ed.experience ?? [],
          projects: ed.projects ?? [],
          certifications: ed.certifications ?? [],
          languages: ed.languages ?? [],
          achievements: ed.achievements ?? [],
          interests: ed.interests ?? [],
        },
      });
      setProgress(100);
      setStage("done");
      void track("onboarding_resume_uploaded");
      void track("onboarding_completed", { properties: { method: "resume" } });
      toast.success("Resume parsed — review and complete your profile");
      nav({ to: "/profile" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to parse resume");
      setStage("choose");
      setProgress(0);
    }
  };

  const stageLabel: Record<typeof stage, string> = {
    role: "",
    choose: "",
    uploading: "Uploading resume…",
    extracting: "Reading PDF…",
    parsing: "Extracting profile with AI…",
    saving: "Saving draft…",
    done: "Done",
  };

  return (
    <div className="min-h-full">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-panel)" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-10 text-white">
          <div className="text-xs uppercase tracking-widest text-white/70">Welcome aboard</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
            Let's set up your profile
          </h1>
          <p className="text-white/80 mt-2 max-w-xl">
            We'll use this to personalize assessments, build your resume, and track readiness.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-10 relative z-10">
        {stage === "role" ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 2</div>
                <h2 className="font-display text-2xl font-semibold tracking-tight mt-1">
                  What role are you targeting?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This shapes every recommendation — assessments, roadmap, mock interviews, and benchmarks.
                </p>
              </div>
              <RoleSelector value={selectedRole} onChange={setSelectedRole} />
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStage("choose")}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Skip for now
                </button>
                <Button onClick={handleRoleNext} disabled={savingRole} className="rounded-xl">
                  {savingRole ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : stage !== "choose" ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">{stageLabel[stage]}</span>
              </div>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                Sit tight — this usually takes 10–20 seconds.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 2 of 2</div>
              <h2 className="font-display text-2xl font-semibold tracking-tight mt-1">
                How do you want to build your profile?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a resume for instant AI parsing — or start from scratch.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="rounded-2xl h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold">Upload your resume</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll auto-fill name, contact, education, experience, projects and skills using AI.
                    </p>
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleResume}
                    />
                    <Button asChild className="w-full rounded-xl">
                      <span className="cursor-pointer">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Upload PDF resume
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground">PDF only, up to 10MB.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="rounded-2xl h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary text-foreground flex items-center justify-center">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold">Create profile manually</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fill in your details yourself. You can come back to this any time.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link to="/profile">Start with a blank profile</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">Nothing is required — fill what you want.</p>
                </CardContent>
              </Card>
            </motion.div>
            </div>
            {selectedRole ? (
              <p className="text-xs text-muted-foreground">
                Target role: <span className="font-medium text-foreground">{selectedRole}</span> —{" "}
                <button
                  type="button"
                  onClick={() => setStage("role")}
                  className="underline-offset-4 hover:underline"
                >
                  change
                </button>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}