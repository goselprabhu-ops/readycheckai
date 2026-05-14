import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthShell } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function ResetPasswordPage() {
  const nav = useNavigate();
  // Step 1: verified via link (session present) OR via OTP code below
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  // OTP path
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // New password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If user arrived via the email link, Supabase exchanges the code in the URL
    // and emits a PASSWORD_RECOVERY event — at that point a session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setVerified(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setVerified(true);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Enter a valid email");
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data,
      token: code,
      type: "recovery",
    });
    setVerifying(false);
    if (error) return toast.error(error.message);
    setVerified(true);
    toast.success("Code verified — set your new password");
  };

  const updatePassword = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };

  if (checking) {
    return (
      <AuthShell title="Reset password" subtitle="Loading…">
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </AuthShell>
    );
  }

  if (!verified) {
    return (
      <AuthShell
        title="Reset password"
        subtitle="Enter the 6-digit code we sent you"
        footer={<>Need a new code? <Link to="/forgot-password" className="text-primary font-medium">Request again</Link></>}
      >
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Verification code</Label>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (<InputOTPSlot key={i} index={i} />))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" disabled={verifying} className="w-full rounded-xl">
            {verifying ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>) : "Verify code"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password to secure your account">
      <form onSubmit={updatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving} className="w-full rounded-xl">
          {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>) : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}