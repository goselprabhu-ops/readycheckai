import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRecommendationOverview } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lightbulb } from "lucide-react";

export function RecommendationsTab() {
  const fn = useServerFn(listRecommendationOverview);
  const [data, setData] = useState<Awaited<ReturnType<typeof listRecommendationOverview>> | null>(null);
  useEffect(() => { fn().then(setData).catch(() => {}); }, []);

  if (!data) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const Pill = ({ map, title }: { map: Record<string, number>; title: string }) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><div className="flex flex-wrap gap-1.5">
        {Object.entries(map).map(([k, v]) => <Badge key={k} variant="outline">{k}: <span className="ml-1 font-bold">{v}</span></Badge>)}
        {Object.keys(map).length === 0 && <span className="text-xs text-muted-foreground">none</span>}
      </div></CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <Pill map={data.bySource} title="Recommendation Sources" />
        <Pill map={data.byStatus} title="By Status" />
        <Pill map={data.byRule} title="By Rule Key" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Recent Recommendations</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Source</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.recent.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-md truncate">{r.title}</TableCell>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell>{r.priority}</TableCell>
                  <TableCell><Badge variant={r.status === "pending" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {data.recent.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">None yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}