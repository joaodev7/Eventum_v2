import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/api/superadmin';
import { api } from '@/services/api';

export interface UserWithDetails {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  trial_ends_at: string | null;
  user_roles: { role: 'admin' | 'user' | 'superadmin' }[];
  subscriptions: {
    status: string;
    plan_id: string;
    billing_cycle: string;
    current_period_end: string | null;
  }[];
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const users = await superAdminApi.getUsers();
      return users.map((u: any): UserWithDetails => ({
        id: u.id,
        email: u.email,
        full_name: u.fullName || null,
        created_at: u.createdAt,
        stripe_customer_id: null,
        trial_ends_at: null,
        user_roles: (u.roles || []).map((r: string) => ({ role: r as any })),
        subscriptions: u.currentPlan ? [{
          status: u.subscriptionStatus || 'active',
          plan_id: u.currentPlan,
          billing_cycle: 'monthly',
          current_period_end: null,
        }] : [],
      }));
    },
  });
}

export function useUserById(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const u = await superAdminApi.getUserDetail(userId);
      return {
        id: u.id,
        email: u.email,
        full_name: u.fullName || null,
        avatar_url: u.avatarUrl || null,
        stripe_customer_id: u.stripeCustomerId || null,
        trial_ends_at: u.trialEndsAt || null,
        created_at: u.createdAt,
        user_roles: (u.roles || []).map((r: string) => ({ role: r as any })),
        subscriptions: (u.subscriptions || []).map((s: any) => ({
          status: s.status,
          plan_id: s.planName,
          billing_cycle: s.billingCycle,
          current_period_end: s.currentPeriodEnd,
          stripe_subscription_id: null,
        })),
        events: (u.events || []).map((e: any) => ({
          ...e,
          userRole: e.userRole || 'owner',
        })),
      };
    },
    enabled: !!userId,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      fullName, 
      email 
    }: { 
      userId: string; 
      fullName: string; 
      email: string; 
    }) => {
      await api.put(`/users/${userId}`, { fullName, email });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: 'admin' | 'user'; 
    }) => {
      return await superAdminApi.updateUserRole(userId, role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
    },
  });
}

export function useAllEvents() {
  return useQuery({
    queryKey: ['all-events-superadmin'],
    queryFn: async () => {
      const events = await superAdminApi.getEvents();
      return events.map((e: any) => ({
        id: e.id,
        slug: e.slug,
        event_name: e.eventName,
        event_type: e.eventType,
        status: e.status,
        event_date: e.eventDate,
        created_at: e.createdAt,
        owner_email: e.ownerEmail,
        owner_name: e.ownerName,
        event_users: [{ role: 'owner' }],
      }));
    },
  });
}

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ['all-subscriptions-superadmin'],
    queryFn: async () => {
      const subs = await superAdminApi.getSubscriptions();
      return subs.map((s: any) => ({
        id: s.id,
        user_id: s.userId,
        user_email: s.userEmail,
        status: s.status,
        billing_cycle: s.billingCycle,
        current_period_end: s.currentPeriodEnd,
        created_at: s.createdAt,
        plan: {
          name: s.planName,
          display_name: s.planDisplayName,
          price_monthly: 0,
          price_yearly: 0,
        },
      }));
    },
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const stats = await superAdminApi.getStats();
      return {
        totalUsers: stats.totalUsers,
        totalEvents: stats.totalEvents,
        activeEvents: stats.totalEvents,
        activeSubscriptions: stats.activeSubscriptions,
        mrr: stats.monthlyRecurringRevenue,
      };
    },
  });
}
