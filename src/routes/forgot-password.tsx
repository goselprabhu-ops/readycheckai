import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";

const schema = z.string().trim().email("Enter a valid email").max(255);

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const nav = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your email for the code or reset link.");
    nav({ to: "/reset-password" });
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send a reset link to your inbox"
      footer={<>Remembered? <Link to="/login" className="text-primary font-medium">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm">
          If an account exists for <strong>{email}</strong>, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>) : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}