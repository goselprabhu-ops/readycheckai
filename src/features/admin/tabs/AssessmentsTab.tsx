import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAssessmentDefinitions, upsertAssessmentDefinition, toggleAssessmentDefinition } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

interface AsmDef { id: string; title: string; description: string | null; category: string; is_active: boolean; created_at: string }

export function AssessmentsTab() {
  const list = useServerFn(listAssessmentDefinitions);
  const upsert = useServerFn(upsertAssessmentDefinition);
  const toggle = useServerFn(toggleAssessmentDefinition);
  const [items, setItems] = useState<AsmDef[]>([]);
  const [editing, setEditing] = useState<Partial<AsmDef> | null>(null);

  const load = async () => {
    try { const r = await list(); setItems(r.items as AsmDef[]); } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    try {
      await upsert({ data: { id: editing.id, title: editing.title!, description: editing.description ?? null, category: editing.category!, is_active: editing.is_active ?? true } });
      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assessment Definitions</CardTitle>
          <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ title: "", category: "sql", is_active: true })}><Plus className="h-4 w-4 mr-1" />New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing?.id ? "Edit Assessment" : "New Assessment"}</DialogTitle></DialogHeader>
              {editing && (
                <div className="space-y-3">
                  <Input placeholder="Title" value={editing.title ?? ""} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                  <Input placeholder="Category (sql, python, powerbi, excel, statistics)" value={editing.category ?? ""} onChange={e => setEditing({ ...editing, category: e.target.value })} />
                  <Textarea placeholder="Description" value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                  <div className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /> <span className="text-sm">Active</span></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Active</TableHead><TableHead>Created</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {items.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                <TableCell><Switch checked={a.is_active} onCheckedChange={v => toggle({ data: { id: a.id, is_active: v } }).then(load)} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => setEditing({ ...a })}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No assessments yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}