import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { generateRoadmap, updateRoadmapItem } from "@/lib/roadmap.functions";
import { toast } from "sonner";
import { Circle, CheckCircle2, Loader2, Target, Sparkles, Clock } from "lucide-react";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

interface Item {
  id: string;
  title: string;
  description: string | null;
  status: string;
  est_minutes: number;
  order_index: number;
}

function RoadmapPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [role, setRole] = useState("Data Analyst");
  const [loading, setLoading] = useState(false);
  const gen = useServerFn(generateRoadmap);
  const upd = useServerFn(updateRoadmapItem);

  const load = async () => {
    const { data } = await supabase
      .from("roadmap_items")
      .select("*")
      .order("order_index", { ascending: true });
    setItems((data ?? []) as any);
  };

  useEffect(() => { load(); }, []);

  const onGen = async () => {
    setLoading(true);
    try {
      const r = await gen({ data: { targetRole: role } });
      setItems((r.items ?? []) as any);
      toast.success("Roadmap generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const cycle = async (it: Item) => {
    const next = it.status === "pending" ? "in_progress" : it.status === "in_progress" ? "done" : "pending";
    await upd({ data: { id: it.id, status: next as any } });
    setItems(items.map((x) => x.id === it.id ? { ...x, status: next } : x));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Adaptive Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalized path to close your skill gaps.</p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <Button onClick={onGen} disabled={loading}>
            {loading ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  How your roadmap works
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We analyze your resume, detected skills, and the gaps for your target role —
                  then generate a sequenced plan of bite-sized tasks. Each task is estimated in
                  minutes; check them off as you go and your readiness score updates with you.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Personalized to your gaps</li>
                  <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Time-boxed micro-tasks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Tracks toward readiness</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <Card key={it.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <button
                  onClick={() => cycle(it)}
                  className="mt-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Mark "${it.title}" as ${
                    it.status === "pending" ? "in progress" : it.status === "in_progress" ? "done" : "pending"
                  }`}
                >
                  {it.status === "done" ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
                   it.status === "in_progress" ? <Loader2 className="h-5 w-5 text-accent" /> :
                   <Circle className="h-5 w-5 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-medium">{it.title}</h3>
                    <Badge variant="outline" className="ml-auto">{it.est_minutes}m</Badge>
                  </div>
                  {it.description && <p className="text-sm text-muted-foreground mt-1">{it.description}</p>}
                </div>
                <FeedbackWidget surface="roadmap" entityId={it.id} feature="roadmap_item" className="shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}