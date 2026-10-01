import { api } from './client';
import { EventDto } from './events';

export interface SuperAdminStatsDto {
  totalUsers: number;
  totalEvents: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

export interface SuperAdminUserDto {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  currentPlan?: string | null;
  subscriptionStatus?: string | null;
  createdAt: string;
}

export interface SuperAdminSubscriptionDto {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  planDisplayName: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd?: string | null;
  createdAt: string;
}

export interface SuperAdminUserDetailDto {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  stripeCustomerId?: string | null;
  trialEndsAt?: string | null;
  roles: string[];
  events: EventDto[];
  subscriptions: SuperAdminSubscriptionDto[];
  createdAt: string;
}

export interface SuperAdminEventDto {
  id: string;
  slug: string;
  eventName: string;
  eventType: string;
  status: string;
  eventDate?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  createdAt: string;
}

export const superAdminApi = {
  getStats: async (): Promise<SuperAdminStatsDto> => {
    const { data } = await api.get<SuperAdminStatsDto>('/superadmin/stats');
    return data;
  },

  getUsers: async (): Promise<SuperAdminUserDto[]> => {
    const { data } = await api.get<SuperAdminUserDto[]>('/superadmin/users');
    return data;
  },

  getUserDetail: async (id: string): Promise<SuperAdminUserDetailDto> => {
    const { data } = await api.get<SuperAdminUserDetailDto>(`/superadmin/users/${id}`);
    return data;
  },

  updateUserRole: async (id: string, role: string): Promise<{ success: boolean }> => {
    const { data } = await api.put<{ success: boolean }>(`/superadmin/users/${id}/role`, { role });
    return data;
  },

  getEvents: async (): Promise<SuperAdminEventDto[]> => {
    const { data } = await api.get<SuperAdminEventDto[]>('/superadmin/events');
    return data;
  },

  getSubscriptions: async (): Promise<SuperAdminSubscriptionDto[]> => {
    const { data } = await api.get<SuperAdminSubscriptionDto[]>('/superadmin/subscriptions');
    return data;
  }
};
