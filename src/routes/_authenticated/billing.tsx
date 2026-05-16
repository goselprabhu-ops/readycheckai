import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { CreditCard, Sparkles, ExternalLink, Calendar, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, planFromPriceId, getStripeEnvironment } from '@/lib/stripe';
import { createPortalSession } from '@/lib/payments.functions';
import { toast } from 'sonner';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';

export const Route = createFileRoute('/_authenticated/billing')({
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const { loading, subscription, plan, isActive } = useSubscription();
  const portal = useServerFn(createPortalSession);
  const [opening, setOpening] = useState(false);

  const openPortal = async () => {
    setOpening(true);
    try {
      const res = await portal({
        data: {
          returnUrl: `${window.location.origin}/billing`,
          environment: getStripeEnvironment(),
        },
      });
      window.open(res.url, '_blank');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not open billing portal');
    } finally {
      setOpening(false);
    }
  };

  const currentPlan = PLANS[plan];
  const renewsAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-3 text-center text-sm">
        <strong>Free during beta</strong> — billing is paused while we test with our first users. You won't be charged.
      </div>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground mt-1">Manage your plan, payment method, and invoices.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/pricing">
              View plans <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Current plan
                </CardTitle>
                <CardDescription>{currentPlan.description}</CardDescription>
              </div>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {loading ? '…' : isActive ? subscription?.status ?? 'active' : 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{currentPlan.name}</span>
              <span className="text-muted-foreground">
                ${currentPlan.priceMonthly}/mo
              </span>
            </div>

            {subscription && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {subscription.cancel_at_period_end ? 'Access until' : 'Renews on'}
                    </div>
                    <div className="font-medium">{renewsAt ?? '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {subscription.cancel_at_period_end ? (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  <div>
                    <div className="text-muted-foreground text-xs">Status</div>
                    <div className="font-medium capitalize">
                      {subscription.cancel_at_period_end ? 'Cancels at period end' : subscription.status}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {subscription ? (
                <Button onClick={openPortal} disabled={opening}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {opening ? 'Opening…' : 'Manage subscription'}
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                </Button>
              ) : (
                <Button onClick={() => navigate({ to: '/pricing' })}>
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan features</CardTitle>
            <CardDescription>What's included in your {currentPlan.name} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-2">
              {currentPlan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing history</CardTitle>
            <CardDescription>Invoices and receipts are available in the secure billing portal.</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <Button variant="outline" onClick={openPortal} disabled={opening}>
                <ExternalLink className="h-4 w-4 mr-2" /> View invoices
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                No invoices yet. {plan === 'free' && <Link to="/pricing" className="underline">Upgrade</Link>} to start your subscription.
              </p>
            )}
          </CardContent>
        </Card>

        {subscription && (
          <p className="text-xs text-muted-foreground text-center">
            Subscription ID: <code className="font-mono">{subscription.stripe_subscription_id.slice(0, 18)}…</code> ·
            Plan: <code className="font-mono">{planFromPriceId(subscription.price_id)}</code>
          </p>
        )}
      </div>
    </div>
  );
}
