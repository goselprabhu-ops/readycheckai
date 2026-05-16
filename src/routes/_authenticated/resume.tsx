import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "@/lib/motion";
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
  registerResumeUpload,
  runResumePipeline,
} from "@/lib/resume.functions";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  FileText,
  Sparkles,
  X,
  RefreshCw,
  Download,
  Target,
  Gauge,
  Pencil,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumePage,
});

type AnalysisResult = {
  mode: "ai" | "fallback" | "ocr";
  score: number;
  detected_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  breakdown: { reason: string; points: number }[];
  analysis: any;
  confidence: number;
  status?: string;
  parsed_fields?: any;
  role_matches?: { data_analyst: number; bi_analyst: number; business_analyst: number };
  ats_breakdown?: { formatting: number; readability: number; keyword_optimization: number; section_structure: number };
  quality_breakdown?: { impact_statements: number; quantified_achievements: number; action_verbs: number; project_descriptions: number };
  rewrites?: { summary?: string; bullets?: { original: string; improved: string }[]; projects?: { original: string; improved: string }[] };
};

function normalize(r: any): AnalysisResult {
  if (r.mode === "ai" || r.mode === "ocr") {
    const skills = (r.detected_skills ?? []).map((s: any) =>
      typeof s === "string" ? s : s.name,
    );
    return {
      mode: r.mode,
      score: r.analysis?.ats_score ?? 0,
      detected_skills: skills,
      missing_skills: (r.analysis?.gaps ?? []) as string[],
      suggestions: (r.analysis?.suggestions ?? []) as string[],
      breakdown: [],
      analysis: r.analysis,
      confidence: r.confidence ?? 1,
      status: r.status,
      parsed_fields: r.parsed_fields ?? r.analysis?.parsed_fields,
      role_matches: r.role_matches ?? r.analysis?.role_matches,
      ats_breakdown: r.ats_breakdown ?? r.analysis?.ats_breakdown,
      quality_breakdown: r.quality_breakdown ?? r.analysis?.quality_breakdown,
      rewrites: r.rewrites ?? r.analysis?.rewrites,
    };
  }
  return {
    mode: "fallback",
    score: r.score ?? 0,
    detected_skills: r.detected_skills ?? [],
    missing_skills: r.missing_skills ?? [],
    suggestions: r.suggestions ?? [],
    breakdown: r.breakdown ?? [],
    analysis: r.analysis,
    confidence: r.confidence ?? 1,
    status: r.status,
  };
}

function ResumePage() {
  const [role, setRole] = useState("Data Analyst");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "analyzing" | "done">(
    "idle",
  );
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pipelineError, setPipelineError] = useState<{
    title: string;
    message: string;
    retryable: boolean;
  } | null>(null);

  const registerUpload = useServerFn(registerResumeUpload);
  const runPipeline = useServerFn(runResumePipeline);

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
    setPipelineError(null);
  };

  const run = async () => {
    if (!file) return;
    setPipelineError(null);
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
      setProgress(30);

      const { resume } = await registerUpload({
        data: { filePath: path, originalName: file.name },
      });
      void track("resume_uploaded", { properties: { sizeKb: Math.round(file.size / 1024) } });

      // 2. Single canonical pipeline call: extract → analyze → persist.
      setStage("extracting");
      setProgress(55);
      const raw = await runPipeline({
        data: {
          filePath: path,
          resumeId: (resume as any).id,
          targetRole: role,
        },
      });
      setProgress(85);

      if (!raw.ok) {
        setPipelineError({
          title: "Couldn't analyze this resume",
          message: raw.message,
          retryable: raw.status !== "image_only_pdf" && raw.status !== "oversized",
        });
        setStage("idle");
        setProgress(0);
        toast.error(raw.message);
        return;
      }

      setStage("analyzing");
      const r = normalize(raw);
      setProgress(100);
      setStage("done");
      setResult(r);
      void track("resume_analyzed", { properties: { score: r.score, mode: r.mode } });
      toast.success(
        r.mode === "fallback"
          ? `AI unavailable — keyword score ${r.score}/100`
          : r.mode === "ocr"
            ? `Scanned PDF read with OCR — ${r.score}/100 (verify accuracy)`
            : `Resume scored ${r.score}/100`,
      );
    } catch (e: any) {
      console.error(e);
      const msg = e?.message ?? "Analysis failed";
      setPipelineError({ title: "Analysis failed", message: msg, retryable: true });
      toast.error(msg);
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
                      aria-label="Remove file"
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
                <p className="text-xs text-muted-foreground capitalize">
                  {stage === "uploading" && "Uploading PDF…"}
                  {stage === "extracting" && "Extracting text from PDF…"}
                  {stage === "analyzing" && "Analyzing against your target role…"}
                </p>
              </div>
            )}

            {pipelineError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{pipelineError.title}</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{pipelineError.message}</p>
                  {pipelineError.retryable && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={run}
                      disabled={!file || loading}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Retry analysis
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
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

      {result && (
        <div id="resume-report" className="space-y-6">
          {result.role_matches && <RoleMatchCards matches={result.role_matches} />}
          {result.ats_breakdown && (
            <SubScoreGrid
              title="ATS compatibility breakdown"
              icon={<Gauge className="h-4 w-4 text-primary" />}
              data={[
                { label: "Formatting", value: result.ats_breakdown.formatting },
                { label: "Readability", value: result.ats_breakdown.readability },
                { label: "Keyword optimization", value: result.ats_breakdown.keyword_optimization },
                { label: "Section structure", value: result.ats_breakdown.section_structure },
              ]}
            />
          )}
          {result.quality_breakdown && (
            <SubScoreGrid
              title="Resume quality"
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              data={[
                { label: "Impact statements", value: result.quality_breakdown.impact_statements },
                { label: "Quantified achievements", value: result.quality_breakdown.quantified_achievements },
                { label: "Action verbs", value: result.quality_breakdown.action_verbs },
                { label: "Project descriptions", value: result.quality_breakdown.project_descriptions },
              ]}
            />
          )}
          {result.parsed_fields && <ParsedFieldsCard fields={result.parsed_fields} />}
          {result.rewrites && <RewritesCard rewrites={result.rewrites} />}
          <BreakdownCard result={result} />
          <div className="flex justify-end print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Download analysis report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultView({ result }: { result: AnalysisResult }) {
  const confidencePct = Math.round((result.confidence ?? 1) * 100);
  const lowConfidence = (result.confidence ?? 1) < 0.5 || result.mode === "ocr";
  const modeLabel =
    result.mode === "ai"
      ? "AI analysis"
      : result.mode === "ocr"
        ? "OCR + AI"
        : "Keyword fallback";
  const modeAria =
    result.mode === "ai"
      ? "Analyzed by AI"
      : result.mode === "ocr"
        ? "Scanned PDF read with OCR, then analyzed by AI — accuracy may vary"
        : "Analyzed by deterministic keyword fallback";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-4">
        <ScoreRing value={result.score} label="Score" />
        <div className="space-y-2 min-w-0">
          <Badge
            variant={result.mode === "ai" ? "default" : result.mode === "ocr" ? "outline" : "secondary"}
            className="text-[10px] uppercase tracking-wide"
            aria-label={modeAria}
          >
            {modeLabel}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-label={`Extraction confidence ${confidencePct} percent`}>
              Extraction confidence: <strong className="text-foreground">{confidencePct}%</strong>
            </span>
          </div>
          <p className="text-sm">{(result.analysis as any)?.summary}</p>
        </div>
      </div>

      {lowConfidence && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low extraction confidence</AlertTitle>
          <AlertDescription>
            {result.mode === "ocr"
              ? "We had to OCR this scanned PDF. Re-uploading a text-based PDF (exported from Word or Google Docs) will give a more accurate score."
              : "Some sections may not have been read cleanly. Re-upload as a text-based PDF for the most accurate result."}
          </AlertDescription>
        </Alert>
      )}

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

function bandClass(v: number) {
  if (v >= 80) return "text-emerald-600";
  if (v >= 60) return "text-primary";
  if (v >= 40) return "text-amber-600";
  return "text-destructive";
}

function RoleMatchCards({
  matches,
}: {
  matches: { data_analyst: number; bi_analyst: number; business_analyst: number };
}) {
  const items = [
    { key: "data_analyst", label: "Data Analyst", value: matches.data_analyst },
    { key: "bi_analyst", label: "BI Analyst", value: matches.bi_analyst },
    { key: "business_analyst", label: "Business Analyst", value: matches.business_analyst },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" /> Role match
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.key} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{it.label}</span>
                <span className={`text-2xl font-semibold tabular-nums ${bandClass(it.value)}`}>
                  {Math.round(it.value)}%
                </span>
              </div>
              <Progress value={it.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SubScoreGrid({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: { label: string; value: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.map((d) => (
            <div key={d.label} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground">{d.label}</span>
                <span className={`text-xl font-semibold tabular-nums ${bandClass(d.value)}`}>
                  {Math.round(d.value)}
                </span>
              </div>
              <Progress value={d.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ParsedFieldsCard({ fields }: { fields: any }) {
  if (!fields || (typeof fields === "object" && Object.keys(fields).length === 0)) return null;
  const education = (fields.education ?? []) as any[];
  const experience = (fields.experience ?? []) as any[];
  const projects = (fields.projects ?? []) as any[];
  const certifications = (fields.certifications ?? []) as string[];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" /> Parsed resume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {(fields.name || fields.email || fields.phone) && (
          <div className="text-sm">
            {fields.name && <div className="font-semibold">{fields.name}</div>}
            <div className="text-muted-foreground text-xs">
              {[fields.email, fields.phone].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}
        {education.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" /> Education
            </h4>
            <ul className="space-y-1 text-sm">
              {education.map((e, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="text-foreground font-medium">{e.degree}</span>
                  {e.institution ? ` · ${e.institution}` : ""}
                  {e.year ? ` · ${e.year}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {experience.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" /> Experience
            </h4>
            <ul className="space-y-3 text-sm">
              {experience.map((x, i) => (
                <li key={i}>
                  <div className="font-medium">
                    {x.title}
                    {x.company ? ` — ${x.company}` : ""}
                  </div>
                  {x.duration && (
                    <div className="text-xs text-muted-foreground">{x.duration}</div>
                  )}
                  {Array.isArray(x.highlights) && x.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-muted-foreground mt-1">
                      {x.highlights.map((h: string, j: number) => (
                        <li key={j}>{h}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {projects.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" /> Projects
            </h4>
            <ul className="space-y-2 text-sm">
              {projects.map((p, i) => (
                <li key={i}>
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="text-muted-foreground">{p.description}</div>
                  )}
                  {Array.isArray(p.tech) && p.tech.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tech.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {certifications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" /> Certifications
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {certifications.map((c, i) => (
                <Badge key={i} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RewritesCard({
  rewrites,
}: {
  rewrites: { summary?: string; bullets?: { original: string; improved: string }[]; projects?: { original: string; improved: string }[] };
}) {
  const hasContent =
    !!rewrites.summary ||
    (rewrites.bullets && rewrites.bullets.length > 0) ||
    (rewrites.projects && rewrites.projects.length > 0);
  if (!hasContent) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pencil className="h-4 w-4 text-primary" /> AI rewrites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {rewrites.summary && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Improved summary</h4>
            <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 p-3">
              {rewrites.summary}
            </p>
          </div>
        )}
        {rewrites.bullets && rewrites.bullets.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Stronger bullets</h4>
            <div className="space-y-3">
              {rewrites.bullets.map((b, i) => (
                <div key={i} className="rounded-md border p-3 space-y-2 text-sm">
                  <div className="text-muted-foreground line-through">{b.original}</div>
                  <div className="text-foreground">{b.improved}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {rewrites.projects && rewrites.projects.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Project rewrites</h4>
            <div className="space-y-3">
              {rewrites.projects.map((p, i) => (
                <div key={i} className="rounded-md border p-3 space-y-2 text-sm">
                  <div className="text-muted-foreground line-through">{p.original}</div>
                  <div className="text-foreground">{p.improved}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
