import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import { analyzeResume } from "@/lib/resume.functions";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumePage,
});

function ResumePage() {
  const [text, setText] = useState("");
  const [role, setRole] = useState("Data Analyst");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const analyze = useServerFn(analyzeResume);

  const onAnalyze = async () => {
    if (text.trim().length < 100) {
      toast.error("Paste at least 100 characters of resume text");
      return;
    }
    setLoading(true);
    try {
      const r = await analyze({ data: { text, targetRole: role } });
      setResult(r);
      toast.success("Resume analyzed");
    } catch (e: any) {
      toast.error(e?.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Resume Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Get an ATS score and concrete fixes against your target role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Your resume</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Target role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Data Analyst" />
            </div>
            <div className="space-y-1.5">
              <Label>Paste resume text</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                placeholder="Paste the full text of your resume…"
              />
            </div>
            <Button onClick={onAnalyze} disabled={loading} className="w-full">
              {loading ? "Analyzing…" : "Analyze with AI"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Analysis</CardTitle></CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-sm text-muted-foreground">Run analysis to see your ATS score, strengths, gaps, and keyword matches.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <ScoreRing value={result.analysis?.ats_score ?? 0} label="ATS" />
                  <p className="text-sm">{result.analysis?.summary}</p>
                </div>

                <Section title="Strengths" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} items={result.analysis?.strengths} />
                <Section title="Gaps" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} items={result.analysis?.gaps} />
                <Section title="Suggestions" icon={<Lightbulb className="h-4 w-4 text-accent" />} items={result.analysis?.suggestions} />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(result.analysis?.keywords ?? []).map((k: string, i: number) => (
                      <Badge key={i} variant="outline">{k}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, icon, items }: { title: string; icon: React.ReactNode; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">{icon}{title}</h4>
      <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}