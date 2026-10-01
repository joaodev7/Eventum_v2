import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/api/subscriptions';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  billing_cycle: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const data = await subscriptionsApi.getCurrentSubscription();
        if (!data) return null;
        return {
          id: data.id || 'current',
          user_id: user.id,
          plan_id: data.planName || 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          status: data.status || 'active',
          billing_cycle: data.billingCycle || 'monthly',
          current_period_start: null,
          current_period_end: data.currentPeriodEnd || null,
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Subscription;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}
