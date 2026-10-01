import { useQuery, useMutation } from '@tanstack/react-query';
import { subscriptionsApi } from '@/api/subscriptions';
import { useAuth } from './useAuth';

export type PlanName = 'free' | 'essentia' | 'atelier' | 'signature';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface PlanLimits {
  max_events: number;
  max_guests: number;
  max_gallery_images: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: unknown;
  limits: unknown;
  is_active: boolean;
  sort_order: number;
  platform_fee_percent: number;
}

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
  plan?: SubscriptionPlan;
}

export interface FeatureFlag {
  id: string;
  feature_key: string;
  display_name: string;
  description: string | null;
  min_plan: PlanName;
}

const PLAN_ORDER: Record<PlanName, number> = {
  free: 0,
  essentia: 1,
  atelier: 2,
  signature: 3,
};

const parseFeatures = (features: unknown): string[] => {
  if (Array.isArray(features)) return features as string[];
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
};

const parseLimits = (limits: unknown): PlanLimits => {
  const defaultLimits: PlanLimits = { max_events: 1, max_guests: 50, max_gallery_images: 10 };
  if (typeof limits === 'string') {
    try {
      limits = JSON.parse(limits);
    } catch {
      return defaultLimits;
    }
  }
  if (typeof limits === 'object' && limits !== null) {
    const l = limits as Record<string, unknown>;
    return {
      max_events: typeof l.max_events === 'number' ? l.max_events : defaultLimits.max_events,
      max_guests: typeof l.max_guests === 'number' ? l.max_guests : defaultLimits.max_guests,
      max_gallery_images: typeof l.max_gallery_images === 'number' ? l.max_gallery_images : defaultLimits.max_gallery_images,
    };
  }
  return defaultLimits;
};

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const plans = await subscriptionsApi.getPlans();
      return plans.map((p: any): SubscriptionPlan => ({
        id: p.id,
        name: p.name,
        display_name: p.displayName,
        price_monthly: p.priceMonthly,
        price_yearly: p.priceYearly,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
        features: p.featuresJson ? parseFeatures(p.featuresJson) : [],
        limits: p.limitsJson ? parseLimits(p.limitsJson) : {},
        is_active: true,
        sort_order: 1,
        platform_fee_percent: p.platformFeePercent || 5,
      }));
    },
  });
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
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
          plan: {
            id: data.planId || data.planName,
            name: data.planName || 'free',
            display_name: data.planDisplayName || 'Gratuito',
            price_monthly: data.priceMonthly || 0,
            price_yearly: data.priceYearly || 0,
            stripe_price_id_monthly: null,
            stripe_price_id_yearly: null,
            features: data.featuresJson ? parseFeatures(data.featuresJson) : [],
            limits: data.limitsJson ? parseLimits(data.limitsJson) : {},
            is_active: true,
            sort_order: 1,
            platform_fee_percent: data.platformFeePercent || 5,
          },
        } as Subscription;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
  });

  const planName = (subscription?.plan?.name?.toLowerCase() || 'free') as PlanName;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialing = subscription?.status === 'trialing';
  
  const daysRemaining = subscription?.current_period_end
    ? Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const canAccess = (featureMinPlan: PlanName): boolean => {
    return (PLAN_ORDER[planName] ?? 0) >= (PLAN_ORDER[featureMinPlan] ?? 0);
  };

  const limits = parseLimits(subscription?.plan?.limits);
  const features = parseFeatures(subscription?.plan?.features);
  const platformFeePercent = subscription?.plan?.platform_fee_percent ?? 5;

  return {
    subscription,
    plan: planName,
    isActive,
    isTrialing,
    isLoading,
    features,
    limits,
    canAccess,
    daysRemaining,
    platformFeePercent,
  };
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      return [
        { id: '1', feature_key: 'eventos_ilimitados', display_name: 'Eventos Ilimitados', description: 'Crie quantos eventos desejar', min_plan: 'essentia' },
        { id: '2', feature_key: 'area_cliente_personalizada', display_name: 'Área do Cliente Personalizada', description: 'Design exclusivo para seus clientes', min_plan: 'essentia' },
        { id: '3', feature_key: 'checklist_avancado', display_name: 'Checklist Avançado', description: 'Gestão completa de tarefas', min_plan: 'essentia' },
        { id: '4', feature_key: 'lista_convidados', display_name: 'Lista de Convidados', description: 'RSVP e confirmação de presença', min_plan: 'essentia' },
        { id: '5', feature_key: 'usuarios_extra', display_name: 'Usuários Extras', description: 'Acesso para sua equipe', min_plan: 'atelier' },
        { id: '6', feature_key: 'relatorios_financeiros', display_name: 'Relatórios Financeiros', description: 'Controle de custos e pagamentos', min_plan: 'atelier' },
        { id: '7', feature_key: 'exportacao_dados', display_name: 'Exportação de Dados', description: 'Exporte relatórios em Excel/PDF', min_plan: 'atelier' },
        { id: '8', feature_key: 'personalizacao_visual', display_name: 'Personalização Visual Total', description: 'Cores, fontes e estilos próprios', min_plan: 'atelier' },
        { id: '9', feature_key: 'suporte_prioritario', display_name: 'Suporte Prioritário', description: 'Atendimento via WhatsApp', min_plan: 'signature' },
        { id: '10', feature_key: 'dominio_personalizado', display_name: 'Domínio Personalizado', description: 'Utilize o seu próprio domínio', min_plan: 'signature' },
      ];
    },
  });
}

export function useFeatureGate(featureKey: string) {
  const { plan, canAccess, isLoading } = useSubscription();
  const { data: flags } = useFeatureFlags();

  const flag = flags?.find((f) => f.feature_key === featureKey);
  const requiredPlan = (flag?.min_plan || 'free') as PlanName;
  const hasAccess = canAccess(requiredPlan);

  return {
    hasAccess,
    requiredPlan,
    isLoading,
    featureName: flag?.display_name || featureKey,
    featureDescription: flag?.description,
  };
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
    }: {
      planId: string;
      billingCycle: 'monthly' | 'yearly';
    }) => {
      return await subscriptionsApi.createCheckoutSession({ planId, billingCycle });
    },
  });
}

export function useCreateCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      return await subscriptionsApi.createCustomerPortal();
    },
  });
}

export const planLabels: Record<PlanName, string> = {
  free: 'Gratuito',
  essentia: 'Essentia',
  atelier: 'Atelier',
  signature: 'Signature',
};

export const planColors: Record<PlanName, string> = {
  free: 'bg-muted text-muted-foreground',
  essentia: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  atelier: 'bg-primary/10 text-primary',
  signature: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};
