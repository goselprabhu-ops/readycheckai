import { loadStripe, Stripe } from '@stripe/stripe-js';

type StripeEnv = 'sandbox' | 'live';

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const environment: StripeEnv = clientToken?.startsWith('pk_test_') ? 'sandbox' : 'live';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) throw new Error('VITE_PAYMENTS_CLIENT_TOKEN is not set');
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return environment;
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceId: null as string | null,
    description: 'Get started with core readiness tools.',
    features: [
      'Role readiness scoring',
      'Basic assessments',
      'Community resume tips',
      '3 AI assessments / day',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 9.99,
    priceId: 'premium_monthly',
    description: 'Unlock the full AI career coach.',
    features: [
      'AI resume intelligence',
      'AI learning roadmaps',
      'Unlimited mock interviews',
      'Advanced analytics',
      'Priority benchmarks',
    ],
  },
  institution: {
    id: 'institution',
    name: 'Institution',
    priceMonthly: 59.99,
    priceId: 'institution_monthly',
    description: 'For colleges, bootcamps & placement teams.',
    features: [
      'Everything in Premium',
      'Cohort analytics dashboard',
      'Placement probability insights',
      'Bulk student onboarding',
      'Exportable reports',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function planFromPriceId(priceId: string | null | undefined): PlanId {
  if (priceId === 'premium_monthly') return 'premium';
  if (priceId === 'institution_monthly') return 'institution';
  return 'free';
}
