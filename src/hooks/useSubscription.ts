import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { planFromPriceId, type PlanId } from '@/lib/stripe';

export interface SubscriptionRow {
  id: string;
  status: string;
  price_id: string;
  product_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
  created_at: string;
}

export interface SubscriptionState {
  loading: boolean;
  subscription: SubscriptionRow | null;
  plan: PlanId;
  isActive: boolean;
  isPremium: boolean;
  isInstitution: boolean;
  refetch: () => Promise<void>;
}

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

function computeIsActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const future = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (ACTIVE_STATUSES.has(row.status) && future) return true;
  if (row.status === 'canceled' && row.current_period_end && new Date(row.current_period_end) > new Date()) return true;
  return false;
}

export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const env = getStripeEnvironment();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('environment', env)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [env]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`subscriptions:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
          () => { void load(); },
        )
        .subscribe();
    })();
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load]);

  const isActive = computeIsActive(subscription);
  const plan: PlanId = isActive ? planFromPriceId(subscription?.price_id) : 'free';

  return {
    loading,
    subscription,
    plan,
    isActive,
    isPremium: isActive && (plan === 'premium' || plan === 'institution'),
    isInstitution: isActive && plan === 'institution',
    refetch: load,
  };
}
