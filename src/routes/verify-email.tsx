import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthShell } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({ email: z.string().email().optional() });

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => search.parse(s),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const nav = useNavigate();
  const { email: initialEmail } = useSearch({ from: "/verify-email" });
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Enter a valid email");
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data,
      token: code,
      type: "signup",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Email verified");
    nav({ to: "/dashboard" });
  };

  const resend = async () => {
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Enter your email first");
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email sent");
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent you, or click the link in the email"
      footer={<>Wrong account? <Link to="/signup" className="text-primary font-medium">Sign up again</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Verification code</Label>
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-xl">
          {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>) : "Verify email"}
        </Button>
        <Button type="button" variant="ghost" disabled={resending} onClick={resend} className="w-full">
          {resending ? "Sending…" : "Resend code"}
        </Button>
      </form>
    </AuthShell>
  );
}