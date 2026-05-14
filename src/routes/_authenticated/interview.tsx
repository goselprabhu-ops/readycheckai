import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { startInterview, interviewTurn } from "@/lib/interview.functions";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/interview")({
  component: InterviewPage,
});

interface Msg { role: "user" | "assistant"; content: string }

function InterviewPage() {
  const [role, setRole] = useState("Data Analyst");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const start = useServerFn(startInterview);
  const turn = useServerFn(interviewTurn);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onStart = async () => {
    setLoading(true);
    try {
      const r = await start({ data: { roleTarget: role } });
      setSessionId(r.sessionId);
      setMessages([{ role: "assistant", content: r.opening }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const onSend = async () => {
    if (!sessionId || !input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const r = await turn({ data: { sessionId, userMessage: userMsg } });
      setMessages((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 h-[calc(100vh-3rem)] flex flex-col">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Mock Interview</h1>
        <p className="text-sm text-muted-foreground mt-1">Practice with an AI interviewer trained on real hiring patterns.</p>
      </div>

      {!sessionId ? (
        <Card>
          <CardContent className="p-4 flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Target role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <Button onClick={onStart} disabled={loading}>{loading ? "Starting…" : "Start interview"}</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-muted-foreground">Interviewer is thinking…</div>}
              <div ref={endRef} />
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer…"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <Button onClick={onSend} disabled={loading || !input.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}