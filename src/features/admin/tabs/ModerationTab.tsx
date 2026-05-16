import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listContentFlags, updateContentFlag } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag } from "lucide-react";
import { toast } from "sonner";

interface Flag { id: string; entity_type: string; entity_id: string | null; entity_ref: string | null; reason: string; notes: string | null; status: string; resolution: string | null; created_at: string }

export function ModerationTab() {
  const list = useServerFn(listContentFlags);
  const update = useServerFn(updateContentFlag);
  const [items, setItems] = useState<Flag[]>([]);
  const [status, setStatus] = useState<"open" | "in_review" | "resolved" | "dismissed" | "all">("open");

  const load = async () => { try { const r = await list({ data: { status } }); setItems(r.flags as Flag[]); } catch (e: any) { toast.error(e.message); } };
  useEffect(() => { load(); }, [status]);

  const setStatusFor = async (id: string, newStatus: "in_review" | "resolved" | "dismissed", resolution?: string) => {
    try { await update({ data: { id, status: newStatus, resolution: resolution ?? null } }); toast.success("Updated"); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-primary" />Content Moderation</CardTitle>
          <Select value={status} onValueChange={v => setStatus(v as any)}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Entity</TableHead><TableHead>Reason</TableHead><TableHead>Notes</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {items.map(f => (
              <TableRow key={f.id}>
                <TableCell><Badge variant="outline">{f.entity_type}</Badge><div className="text-[10px] text-muted-foreground mt-1 font-mono truncate max-w-[120px]">{f.entity_ref ?? f.entity_id ?? ""}</div></TableCell>
                <TableCell><Badge>{f.reason}</Badge></TableCell>
                <TableCell className="max-w-md truncate text-xs text-muted-foreground">{f.notes ?? "—"}</TableCell>
                <TableCell><Badge variant={f.status === "open" ? "destructive" : f.status === "in_review" ? "default" : "secondary"}>{f.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {f.status === "open" && <Button size="sm" variant="outline" onClick={() => setStatusFor(f.id, "in_review")}>Review</Button>}
                    {f.status !== "resolved" && <Button size="sm" onClick={() => setStatusFor(f.id, "resolved", "Action taken")}>Resolve</Button>}
                    {f.status !== "dismissed" && <Button size="sm" variant="ghost" onClick={() => setStatusFor(f.id, "dismissed", "Not actionable")}>Dismiss</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No flagged content.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}