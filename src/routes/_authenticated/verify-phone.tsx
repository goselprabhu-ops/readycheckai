import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/phone-otp.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/verify-phone")({
  component: VerifyPhonePage,
});

function VerifyPhonePage() {
  const nav = useNavigate();
  const sendOtp = useServerFn(sendPhoneOtp);
  const verifyOtp = useServerFn(verifyPhoneOtp);
  const fetchProfile = useServerFn(getMyProfile);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    (async () => {
      const { profile } = await fetchProfile();
      if ((profile as any)?.phone_verified) {
        nav({ to: "/onboarding" });
        return;
      }
      const { data } = await supabase.auth.getUser();
      const metaPhone =
        ((data.user?.user_metadata as any)?.phone as string | undefined) ?? "";
      const profPhone = (profile as any)?.phone as string | undefined;
      setPhone(profPhone || metaPhone || "");
    })();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    setSending(true);
    try {
      await sendOtp({ data: { phone: phone.trim() } });
      toast.success("Code sent. Check your SMS.");
      setStep("code");
      setCooldown(30);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send code");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await verifyOtp({ data: { phone: phone.trim(), code } });
      toast.success("Phone verified!");
      nav({ to: "/onboarding" });
    } catch (err: any) {
      toast.error(err?.message ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Verify your mobile number</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            We need to confirm your phone number before you continue.
          </p>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile number (E.164 format)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    required
                    className="pl-9"
                    placeholder="+14155552671"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : "Send code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 4-digit code we sent to <span className="font-medium text-foreground">{phone}</span>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  className="text-center text-2xl tracking-[0.5em]"
                  placeholder="••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              <Button type="submit" disabled={verifying || code.length !== 4} className="w-full">
                {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</> : "Verify"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setStep("phone")}
                >
                  Change number
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || sending}
                  className="text-primary disabled:opacity-50"
                  onClick={() => handleSend()}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}