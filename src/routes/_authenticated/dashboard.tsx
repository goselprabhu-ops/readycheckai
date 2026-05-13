import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import { supabase } from "@/integrations/supabase/client";
import { recomputeEmployability } from "@/lib/employability.functions";
import { FileText, Brain, Target, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface Score {
  resume_score: number;
  skills_score: number;
  market_fit: number;
  composite: number;
}

function Dashboard() {
  const [score, setScore] = useState<Score | null>(null);
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const recompute = useServerFn(recomputeEmployability);

  const load = async () => {
    const { data: s } = await supabase
      .from("employability_scores")
      .select("*")
      .order("computed_at", { ascending: false })
      .limit(1);
    if (s && s[0]) setScore(s[0] as any);
    const { data: sk } = await supabase
      .from("skills")
      .select("name, level")
      .order("updated_at", { ascending: false })
      .limit(8);
    setSkills((sk ?? []) as any);
  };

  useEffect(() => { load(); }, []);

  const onRecompute = async () => {
    setLoading(true);
    try {
      const r = await recompute();
      setScore(r as any);
      toast.success("Employability score updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your employability intelligence at a glance.</p>
        </div>
        <Button onClick={onRecompute} disabled={loading}>
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? "Computing…" : "Recompute score"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Composite Employability</CardTitle>
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
          <CardContent>
            <ScoreRing value={score?.resume_score ?? 0} label="ATS" size={100} />
            <Button asChild variant="outline" size="sm" className="w-full mt-3">
              <Link to="/resume"><FileText className="h-4 w-4 mr-2" />Analyze</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Skills</CardTitle></CardHeader>
          <CardContent>
            <ScoreRing value={score?.skills_score ?? 0} label="avg" size={100} />
            <Button asChild variant="outline" size="sm" className="w-full mt-3">
              <Link to="/assessment"><Brain className="h-4 w-4 mr-2" />Assess</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Detected Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills yet. Analyze your resume or take an assessment.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {s.name} <span className="font-mono text-xs opacity-70">{s.level}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Next Steps</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/roadmap"><Target className="h-4 w-4 mr-2" />Generate adaptive roadmap</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/interview"><MessageSquare className="h-4 w-4 mr-2" />Practice mock interview</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}