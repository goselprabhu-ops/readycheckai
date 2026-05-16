import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bulkImportQuestions, listAssessmentDefinitions } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const SAMPLE = `prompt,topic,difficulty,points,option1,option2,option3,option4,correct_answer,explanation
"What is a SQL JOIN?",sql,easy,1,"Combine rows","Delete rows","Update rows","Create table","Combine rows","Joins combine rows from related tables"`;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { cur.push(field); field = ""; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(c => c.trim()));
}

export function BulkUploadTab() {
  const importFn = useServerFn(bulkImportQuestions);
  const listAsm = useServerFn(listAssessmentDefinitions);
  const [csv, setCsv] = useState(SAMPLE);
  const [asm, setAsm] = useState<string>("");
  const [assessments, setAssessments] = useState<Array<{ id: string; title: string }>>([]);
  const [result, setResult] = useState<{ inserted: number; failed: number; errors: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { listAsm().then(r => setAssessments(r.items as any)); }, []);

  const onFile = (f: File) => { const fr = new FileReader(); fr.onload = () => setCsv(String(fr.result)); fr.readAsText(f); };

  const run = async () => {
    if (!asm) { toast.error("Pick an assessment"); return; }
    const rows = parseCSV(csv);
    if (rows.length < 2) { toast.error("CSV needs header + data rows"); return; }
    const header = rows[0].map(h => h.trim());
    const idx = (k: string) => header.indexOf(k);
    const data = rows.slice(1).map(r => {
      const opts = ["option1", "option2", "option3", "option4", "option5", "option6"]
        .map(k => idx(k) >= 0 ? r[idx(k)] : "")
        .filter(s => s && s.trim());
      return {
        prompt: r[idx("prompt")] ?? "",
        topic: idx("topic") >= 0 ? r[idx("topic")] : undefined,
        difficulty: ((idx("difficulty") >= 0 ? r[idx("difficulty")] : "medium") as "easy" | "medium" | "hard"),
        points: idx("points") >= 0 ? Number(r[idx("points")] || 1) : 1,
        options: opts,
        correct_answer: r[idx("correct_answer")] ?? "",
        explanation: idx("explanation") >= 0 ? r[idx("explanation")] : undefined,
      };
    });
    setBusy(true);
    try {
      const r = await importFn({ data: { assessment_id: asm, rows: data } });
      setResult(r);
      toast.success(`Imported ${r.inserted} · ${r.failed} failed`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />CSV Bulk Upload</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <Select value={asm} onValueChange={setAsm}>
            <SelectTrigger><SelectValue placeholder="Choose assessment" /></SelectTrigger>
            <SelectContent>{assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
        <p className="text-xs text-muted-foreground">Columns: prompt, topic, difficulty, points, option1..option6, correct_answer, explanation</p>
        <Textarea value={csv} onChange={e => setCsv(e.target.value)} className="font-mono text-xs h-56" />
        <Button onClick={run} disabled={busy}>{busy ? "Importing…" : "Import"}</Button>
        {result && (
          <div className="text-sm space-y-1 border rounded-md p-3">
            <div><span className="font-medium text-primary">{result.inserted}</span> inserted · <span className="font-medium text-destructive">{result.failed}</span> failed</div>
            {result.errors.map((e, i) => <div key={i} className="text-xs text-destructive">{e}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}