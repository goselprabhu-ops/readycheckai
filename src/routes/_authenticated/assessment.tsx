import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAssessment, submitAssessment } from "@/lib/assessment.functions";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assessment")({
  component: AssessmentPage,
});

interface Q {
  id: string;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

function AssessmentPage() {
  const [topic, setTopic] = useState<"sql" | "python" | "analytics" | "statistics" | "excel">("sql");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<{ score: number; total: number; level: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const gen = useServerFn(generateAssessment);
  const sub = useServerFn(submitAssessment);

  const start = async () => {
    setLoading(true);
    setSubmitted(null);
    setAnswers({});
    try {
      const r = await gen({ data: { topic, count: 5 } });
      setQuestions(r.questions as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Answer all questions first");
      return;
    }
    setLoading(true);
    try {
      const results = questions.map((q) => ({
        question: q.question,
        correct: answers[q.id] === q.answer_index,
      }));
      const r = await sub({ data: { topic, results } });
      setSubmitted({ score: r.assessment.score, total: r.assessment.total, level: r.level });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Skill Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated MCQs calibrated to industry demand.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Choose a topic</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Topic</Label>
            <Select value={topic} onValueChange={(v) => setTopic(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="statistics">Statistics</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={start} disabled={loading}>
            {loading && questions.length === 0 ? "Generating…" : "Start"}
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">Q{qi + 1}. {q.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, i) => {
                  const picked = answers[q.id] === i;
                  const correct = submitted && i === q.answer_index;
                  const wrong = submitted && picked && i !== q.answer_index;
                  return (
                    <button
                      key={i}
                      disabled={!!submitted}
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      className={`w-full text-left text-sm rounded-md border px-3 py-2 transition flex items-center gap-2 ${
                        correct ? "border-primary bg-primary/5" :
                        wrong ? "border-destructive bg-destructive/5" :
                        picked ? "border-primary" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      {submitted && correct && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      {submitted && wrong && <XCircle className="h-4 w-4 text-destructive" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
                {submitted && (
                  <p className="text-xs text-muted-foreground mt-2">{q.explanation}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {!submitted ? (
            <Button onClick={submit} disabled={loading} className="w-full">Submit</Button>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="font-display text-4xl font-semibold">{submitted.score}/{submitted.total}</div>
                <p className="text-sm text-muted-foreground mt-1">Skill level: {submitted.level}/100</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}