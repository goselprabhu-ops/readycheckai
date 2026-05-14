import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/score-ring";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeResumeAuto,
  registerResumeUpload,
  extractResumeText,
} from "@/lib/resume.functions";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  FileText,
  Sparkles,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumePage,
});

type AnalysisResult = Awaited<ReturnType<typeof analyzeResumeAuto>>;

function ResumePage() {
  const [role, setRole] = useState("Data Analyst");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "analyzing" | "done">(
    "idle",
  );
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useServerFn(analyzeResumeAuto);
  const registerUpload = useServerFn(registerResumeUpload);
  const extractText = useServerFn(extractResumeText);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Please drop a PDF file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(f);
    setResult(null);
    setStage("idle");
    setProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxFiles: 1,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleBrowseClick = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onDrop([f]);
    e.target.value = "";
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStage("idle");
    setProgress(0);
  };

  const run = async () => {
    if (!file) return;
    try {
      // 1. Upload to storage
      setStage("uploading");
      setProgress(15);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (upErr) throw upErr;
      setProgress(35);

      const { resume } = await registerUpload({
        data: { filePath: path, originalName: file.name },
      });

      // 2. Extract text on the server (Worker-compatible parser).
      setStage("extracting");
      setProgress(55);
      const { text } = await extractText({ data: { filePath: path } });
      setProgress(75);

      // 3. Keyword analysis on server (deterministic)
      setStage("analyzing");
      const r = await analyze({
        data: { text, targetRole: role, resumeId: (resume as any)?.id },
      });
      setProgress(100);
      setStage("done");
      setResult(r);
      const score = (r as any).score ?? (r as any).analysis?.ats_score ?? 0;
      toast.success(
        r.mode === "fallback"
          ? `AI unavailable — keyword score ${score}/100`
          : `Resume scored ${score}/100`,
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Analysis failed");
      setStage("idle");
      setProgress(0);
    }
  };

  const loading = stage !== "idle" && stage !== "done";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Resume Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drop your resume PDF to get an instant readiness score, detected skills, and
          improvement suggestions for your target role.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Upload your resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Data Analyst"
              />
            </div>

            <div
              {...getRootProps()}
              className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <input {...getInputProps()} />
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[260px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB · PDF
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {isDragActive ? "Drop the PDF here" : "Drag & drop your resume PDF"}
                    </p>
                    <p className="text-xs text-muted-foreground">or click to browse · max 10MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowseClick}
                disabled={loading}
                className="w-full"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Upload file
              </Button>
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground capitalize">{stage}…</p>
              </div>
            )}

            <Button onClick={run} disabled={!file || loading} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Analyzing…" : "Analyze resume"}
            </Button>
          </CardContent>
        </Card>

        {/* Result card */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonResult />
            ) : !result ? (
              <p className="text-sm text-muted-foreground">
                Upload a resume to see your score, detected skills, missing skills, and
                improvement suggestions.
              </p>
            ) : (
              <ResultView result={result} />
            )}
          </CardContent>
        </Card>
      </div>

      {result && <BreakdownCard result={result} />}
    </div>
  );
}

function ResultView({ result }: { result: AnalysisResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-4">
        <ScoreRing value={result.score} label="Score" />
        <p className="text-sm">{(result.analysis as any)?.summary}</p>
      </div>

      <Section
        title="Detected skills"
        icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
      >
        <div className="flex flex-wrap gap-1.5">
          {result.detected_skills.length === 0 ? (
            <span className="text-sm text-muted-foreground">None detected.</span>
          ) : (
            result.detected_skills.map((s) => (
              <Badge key={s} variant="default">
                {s}
              </Badge>
            ))
          )}
        </div>
      </Section>

      <Section
        title="Missing skills"
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
      >
        <div className="flex flex-wrap gap-1.5">
          {result.missing_skills.length === 0 ? (
            <span className="text-sm text-muted-foreground">All target areas covered 🎉</span>
          ) : (
            result.missing_skills.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))
          )}
        </div>
      </Section>

      <Section title="Suggestions" icon={<Lightbulb className="h-4 w-4 text-accent" />}>
        {result.suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions — looking strong.</p>
        ) : (
          <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </Section>
    </motion.div>
  );
}

function BreakdownCard({ result }: { result: AnalysisResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {result.breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No points awarded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.breakdown.map((b, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-3 flex items-center justify-between"
              >
                <span className="text-sm">{b.reason}</span>
                <Badge>+{b.points}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function SkeletonResult() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-md" />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
    </div>
  );
}
