import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/score-ring";
import { supabase } from "@/integrations/supabase/client";
import { Brain, FileText, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/results")({
  component: ResultsPage,
});

interface Score {
  resume_score: number;
  skills_score: number;
  market_fit: number;
  composite: number;
  computed_at: string;
}
interface Assessment {
  id: string;
  topic: string;
  score: number;
  total: number;
  created_at: string;
}
interface Analysis {
  id: string;
  ats_score: number;
  summary: string | null;
  created_at: string;
}

function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<Score | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    (async () => {
      const [s, a, r] = await Promise.all([
        supabase.from("employability_scores").select("*").order("computed_at", { ascending: false }).limit(1),
        supabase.from("assessments").select("id, topic, score, total, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("resume_analyses").select("id, ats_score, summary, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      if (s.data?.[0]) setScore(s.data[0] as any);
      setAssessments((a.data ?? []) as any);
      setAnalyses((r.data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Your Results</h1>
        <p className="text-sm text-muted-foreground mt-1">Readiness scores, assessment history, and resume analyses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-44 md:col-span-2 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </>
        ) : (
          <>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Composite Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <ScoreRing value={score?.composite ?? 0} label="overall" />
                <div className="space-y-1 text-sm">
                  <div>Resume ATS: <span className="font-mono">{score?.resume_score ?? 0}</span></div>
                  <div>Skills: <span className="font-mono">{score?.skills_score ?? 0}</span></div>
                  <div>Market Fit: <span className="font-mono">{score?.market_fit ?? 0}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Resume</CardTitle></CardHeader>
              <CardContent><ScoreRing value={score?.resume_score ?? 0} label="ATS" size={100} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Skills</CardTitle></CardHeader>
              <CardContent><ScoreRing value={score?.skills_score ?? 0} label="avg" size={100} /></CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4" /> Recent assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}</div>
            ) : assessments.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No assessments yet. <Link to="/assessment" className="text-primary underline">Take one</Link>.
              </div>
            ) : (
              <ul className="divide-y">
                {assessments.map((a) => {
                  const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                  return (
                    <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium capitalize">{a.topic}</div>
                        <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{a.score}/{a.total}</span>
                        <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "outline"}>{pct}%</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Resume analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
            ) : analyses.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No analyses yet. <Link to="/resume" className="text-primary underline">Analyze a resume</Link>.
              </div>
            ) : (
              <ul className="space-y-3">
                {analyses.map((a) => (
                  <li key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Badge>ATS {a.ats_score}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    {a.summary && <p className="text-sm text-muted-foreground mt-2">{a.summary}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button asChild variant="outline"><Link to="/assessment">Take an assessment</Link></Button>
        <Button asChild variant="outline"><Link to="/resume">Analyze a resume</Link></Button>
      </div>
    </div>
  );
}