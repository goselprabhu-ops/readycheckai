import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listQuestions, upsertQuestion, deleteQuestion, listAssessmentDefinitions } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Q {
  id: string;
  assessment_id: string;
  prompt: string;
  topic: string | null;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  options: string[];
  order_index: number;
}

interface AsmDef { id: string; title: string; category: string }

export function QuestionsTab() {
  const list = useServerFn(listQuestions);
  const upsert = useServerFn(upsertQuestion);
  const del = useServerFn(deleteQuestion);
  const listAsm = useServerFn(listAssessmentDefinitions);
  const [items, setItems] = useState<Q[]>([]);
  const [assessments, setAssessments] = useState<AsmDef[]>([]);
  const [filterAsm, setFilterAsm] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Q> & { correct_answer?: string; explanation?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await list({ data: { assessmentId: filterAsm === "all" ? undefined : filterAsm, search: search || undefined, limit: 100 } });
      setItems(r.items as Q[]);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { listAsm().then(r => setAssessments(r.items as AsmDef[])); }, []);
  useEffect(() => { load(); }, [filterAsm]);

  const save = async () => {
    if (!editing) return;
    try {
      await upsert({ data: {
        id: editing.id,
        assessment_id: editing.assessment_id!,
        prompt: editing.prompt!,
        topic: editing.topic ?? null,
        difficulty: (editing.difficulty ?? "medium"),
        points: editing.points ?? 1,
        options: editing.options ?? [],
        order_index: editing.order_index ?? 0,
        correct_answer: editing.correct_answer!,
        explanation: editing.explanation ?? null,
      }});
      toast.success("Question saved");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete question?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  const startNew = () => setEditing({ assessment_id: filterAsm !== "all" ? filterAsm : assessments[0]?.id, prompt: "", difficulty: "medium", points: 1, options: ["", "", "", ""], order_index: items.length, correct_answer: "" });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Question Bank</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} placeholder="Search prompts" className="pl-7 h-9 w-56" />
            </div>
            <Select value={filterAsm} onValueChange={setFilterAsm}>
              <SelectTrigger className="h-9 w-56"><SelectValue placeholder="All assessments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assessments</SelectItem>
                {assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" />New</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editing?.id ? "Edit Question" : "New Question"}</DialogTitle></DialogHeader>
                {editing && (
                  <div className="space-y-3">
                    <Select value={editing.assessment_id} onValueChange={v => setEditing({ ...editing, assessment_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Assessment" /></SelectTrigger>
                      <SelectContent>{assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
                    </Select>
                    <Textarea placeholder="Prompt" value={editing.prompt ?? ""} onChange={e => setEditing({ ...editing, prompt: e.target.value })} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Topic" value={editing.topic ?? ""} onChange={e => setEditing({ ...editing, topic: e.target.value })} />
                      <Select value={editing.difficulty ?? "medium"} onValueChange={v => setEditing({ ...editing, difficulty: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} max={20} placeholder="Points" value={editing.points ?? 1} onChange={e => setEditing({ ...editing, points: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase text-muted-foreground">Options</div>
                      {(editing.options ?? []).map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input value={opt} onChange={e => { const ops = [...(editing.options ?? [])]; ops[i] = e.target.value; setEditing({ ...editing, options: ops }); }} placeholder={`Option ${i + 1}`} />
                          <Button variant="ghost" size="sm" onClick={() => setEditing({ ...editing, options: (editing.options ?? []).filter((_, j) => j !== i) })}>×</Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setEditing({ ...editing, options: [...(editing.options ?? []), ""] })}>+ Add option</Button>
                    </div>
                    <Input placeholder="Correct answer (must match an option)" value={editing.correct_answer ?? ""} onChange={e => setEditing({ ...editing, correct_answer: e.target.value })} />
                    <Textarea placeholder="Explanation (optional)" value={editing.explanation ?? ""} onChange={e => setEditing({ ...editing, explanation: e.target.value })} />
                  </div>
                )}
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={save}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Prompt</TableHead><TableHead>Topic</TableHead><TableHead>Difficulty</TableHead><TableHead>Points</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
            <TableBody>
              {items.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-md truncate">{q.prompt}</TableCell>
                  <TableCell><Badge variant="outline">{q.topic ?? "—"}</Badge></TableCell>
                  <TableCell><Badge variant={q.difficulty === "hard" ? "destructive" : q.difficulty === "easy" ? "secondary" : "default"}>{q.difficulty}</Badge></TableCell>
                  <TableCell>{q.points}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing({ ...q })}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(q.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No questions.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}