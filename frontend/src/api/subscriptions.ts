import { api } from './client';

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  featuresJson: string;
  limitsJson: string;
  platformFeePercent: number;
}

export const subscriptionsApi = {
  getPlans: async (): Promise<SubscriptionPlanDto[]> => {
    const { data } = await api.get<SubscriptionPlanDto[]>('/subscriptions/plans');
    return data;
  },

  getCurrentSubscription: async (): Promise<any> => {
    const { data } = await api.get<any>('/subscriptions/current');
    return data;
  },

  createCheckoutSession: async (payload: { planId: string; billingCycle: string; successUrl?: string; cancelUrl?: string }): Promise<{ url: string }> => {
    const { data } = await api.post<{ url: string }>('/subscriptions/checkout-session', payload);
    return data;
  },

  createCustomerPortal: async (payload?: { returnUrl?: string }): Promise<{ url: string }> => {
    const { data } = await api.post<{ url: string }>('/subscriptions/customer-portal', payload || {});
    return data;
  }
};
