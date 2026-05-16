import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Check, Sparkles, Building2, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PLANS, type PlanId } from '@/lib/stripe';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { StripeEmbeddedCheckoutPanel } from '@/components/StripeEmbeddedCheckout';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: 'Pricing — ReadyCheck Lab' },
      { name: 'description', content: 'Simple, transparent pricing for individuals and institutions. Unlock AI resume intelligence, mock interviews, and cohort analytics.' },
    ],
  }),
});

const ICONS: Record<PlanId, React.ComponentType<{ className?: string }>> = {
  free: Rocket,
  premium: Sparkles,
  institution: Building2,
};

function PricingPage() {
  const navigate = useNavigate();
  const [openPlan, setOpenPlan] = useState<PlanId | null>(null);

  const handleSelect = async (planId: PlanId) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      void navigate({ to: '/login' });
      return;
    }
    if (planId === 'free') {
      void navigate({ to: '/dashboard' });
      return;
    }
    void track('upgrade_started', { properties: { planId } });
    setOpenPlan(planId);
  };

  const order: PlanId[] = ['free', 'premium', 'institution'];

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Build career readiness — at your pace
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free. Upgrade when you're ready for AI coaching, deeper analytics, or to roll out across a cohort.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {order.map((id) => {
            const plan = PLANS[id];
            const Icon = ICONS[id];
            const isFeatured = id === 'premium';
            return (
              <Card
                key={id}
                className={`relative flex flex-col ${isFeatured ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' : ''}`}
              >
                {isFeatured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.priceMonthly}</span>
                    {plan.priceMonthly > 0 && <span className="text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSelect(id)}
                    variant={isFeatured ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {id === 'free' ? 'Get started' : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already subscribed?{' '}
          <Link to="/billing" className="underline">Manage billing</Link>
        </p>
      </div>

      <Dialog open={openPlan !== null} onOpenChange={(o) => !o && setOpenPlan(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
            <DialogTitle>
              Checkout — {openPlan ? PLANS[openPlan].name : ''}
            </DialogTitle>
            <button
              onClick={() => setOpenPlan(null)}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          {openPlan && PLANS[openPlan].priceId && (
            <div className="max-h-[70vh] overflow-y-auto">
              <StripeEmbeddedCheckoutPanel priceId={PLANS[openPlan].priceId as string} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
