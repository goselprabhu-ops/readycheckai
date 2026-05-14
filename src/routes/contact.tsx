import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — ReadyCheck Lab" },
    { name: "description", content: "Get in touch with the ReadyCheck Lab team about partnerships, deployments, or research collaborations." },
  ] }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Message received. We'll be in touch shortly.");
    }, 600);
  };

  return (
    <MarketingShell
      eyebrow="CONTACT"
      title={<>Let's measure <span className="text-[oklch(0.72_0.2_250)]">what matters</span> together.</>}
      intro="Tell us about your institution, learners, or workforce — we'll show you what readiness intelligence can unlock."
    >
      <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-3 gap-10">
        <div className="space-y-6">
          {[
            { icon: Mail, label: "Email", value: "hello@readychecklab.com" },
            { icon: Phone, label: "Phone", value: "+91 00000 00000" },
            { icon: MapPin, label: "Office", value: "Bengaluru, India" },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                <c.icon className="size-5" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{c.label}</div>
                <div className="text-sm mt-0.5">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org">Organization</Label>
            <Input id="org" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea id="message" rows={5} required />
          </div>
          <Button type="submit" disabled={sending} size="lg">
            {sending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </section>
    </MarketingShell>
  );
}