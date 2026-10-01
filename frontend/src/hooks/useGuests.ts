import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { guestsApi } from '@/api/guests';
import { publicApi } from '@/api/public';
import { Guest, GuestWithTable, DashboardMetrics, InviteStatus, GuestGroup, Table, GuestCompanion } from '@/lib/types';

interface EventInfo {
  id: string;
  slug: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_maps_link: string | null;
  hero_image_url: string | null;
  welcome_message: string | null;
  theme_config?: Record<string, unknown> | null;
}

export interface GuestWithEvent extends GuestWithTable {
  event_info?: EventInfo | null;
  invite_email_sent_at?: string | null;
}

export function useGuests(eventId?: string, filters?: { status?: InviteStatus; group?: GuestGroup; search?: string }) {
  return useQuery({
    queryKey: ['guests', eventId, filters],
    queryFn: async () => {
      if (!eventId) return [];

      const data = await guestsApi.getGuests(eventId, {
        status: filters?.status,
        group: filters?.group,
        search: filters?.search,
      });

      return data.map((g: any): GuestWithTable => ({
        id: g.id,
        event_id: g.eventId || eventId,
        name: g.name,
        email: g.email || null,
        phone: g.phone || null,
        guest_group: (g.guestGroup?.toLowerCase() || 'other') as GuestGroup,
        table_id: g.tableId || null,
        token: g.token,
        status: (g.status?.toLowerCase() || 'pending') as InviteStatus,
        companions: g.companions || 0,
        has_viewed: g.hasViewed || false,
        viewed_at: g.viewedAt || null,
        responded_at: g.respondedAt || null,
        notes: g.notes || null,
        invite_email_sent_at: g.inviteEmailSentAt || null,
        created_at: g.createdAt,
        updated_at: g.updatedAt,
        table: g.tableId ? {
          id: g.tableId,
          name: g.tableName || '',
          capacity: 0,
          description: null,
          event_id: eventId,
          created_at: g.createdAt,
        } : null,
        companions_list: (g.companionsList || []).map((c: any): GuestCompanion => ({
          id: c.id,
          guest_id: c.guestId || g.id,
          name: c.name,
          will_attend: c.willAttend ?? null,
          event_id: eventId,
          created_at: g.createdAt,
        })),
      }));
    },
    enabled: !!eventId,
  });
}

export function useGuestByToken(token: string) {
  return useQuery({
    queryKey: ['guest', token],
    queryFn: async () => {
      const data = await publicApi.getInvite(token);
      if (!data || !data.guest) return null;

      const g = data.guest;
      const ev = data.event;

      let parsedTheme = null;
      if (ev?.themeConfigJson) {
        try {
          parsedTheme = JSON.parse(ev.themeConfigJson);
        } catch {
          parsedTheme = null;
        }
      }

      const eventInfo: EventInfo = {
        id: ev.id,
        slug: ev.slug,
        event_name: ev.eventName,
        event_date: ev.eventDate || null,
        event_time: ev.eventTime || null,
        venue_name: ev.venueName || null,
        venue_address: ev.venueAddress || null,
        venue_maps_link: ev.venueMapsLink || null,
        hero_image_url: ev.heroImageUrl || null,
        welcome_message: ev.welcomeMessage || null,
        theme_config: parsedTheme,
      };

      const guest: GuestWithEvent = {
        id: g.id,
        name: g.name,
        email: g.email || null,
        phone: g.phone || null,
        guest_group: (g.guestGroup?.toLowerCase() || 'other') as GuestGroup,
        status: (g.status?.toLowerCase() || 'pending') as InviteStatus,
        companions: g.companions || 0,
        notes: g.notes || null,
        table_id: g.tableId || null,
        has_viewed: g.hasViewed || false,
        viewed_at: null,
        responded_at: null,
        token: token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_id: ev.id,
        invite_email_sent_at: null,
        table: g.tableId ? {
          id: g.tableId,
          name: g.tableName || '',
          description: null,
          capacity: 0,
          event_id: ev.id,
          created_at: new Date().toISOString(),
        } as Table : null,
        companions_list: (g.companionsList || []).map((c: any) => ({
          id: c.id,
          guest_id: c.guestId || g.id,
          name: c.name,
          will_attend: c.willAttend ?? null,
          event_id: ev.id,
          created_at: new Date().toISOString(),
        })),
        event_info: eventInfo,
      };

      return guest;
    },
    enabled: !!token,
  });
}

export function useDashboardMetrics(eventId?: string) {
  return useQuery({
    queryKey: ['dashboard-metrics', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      const data = await guestsApi.getMetrics(eventId);
      const metrics: DashboardMetrics = {
        total: data.total,
        totalGuests: data.totalGuests,
        totalCompanions: data.totalCompanions,
        accepted: data.accepted,
        acceptedGuests: data.accepted,
        acceptedCompanions: data.totalCompanions,
        declined: data.declined,
        declinedGuests: data.declined,
        declinedCompanions: 0,
        pending: data.pending,
        pendingGuests: data.pending,
        pendingCompanions: 0,
        viewed: data.viewed,
        viewedGuests: data.viewed,
        viewedCompanions: 0,
      };
      return metrics;
    },
    enabled: !!eventId,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guest: Omit<Guest, 'id' | 'token' | 'created_at' | 'updated_at' | 'has_viewed' | 'viewed_at' | 'responded_at' | 'invite_email_sent_at'> & { companions_list?: { name: string }[] }) => {
      const payload = {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        guestGroup: guest.guest_group,
        tableId: guest.table_id || null,
        notes: guest.notes,
        companions: (guest.companions_list || []).map(c => ({ name: c.name }))
      };
      return await guestsApi.createGuest(guest.event_id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', variables.event_id] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Guest> & { id: string }) => {
      const eventId = updates.event_id;
      if (!eventId) throw new Error('event_id is required to update guest');

      const payload = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        guestGroup: updates.guest_group,
        tableId: updates.table_id || null,
        status: updates.status,
        notes: updates.notes,
        companions: updates.companions_list?.map(c => ({ name: c.name }))
      };
      return await guestsApi.updateGuest(eventId, id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-guests', variables.event_id] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await guestsApi.deleteGuest(eventId, id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-guests', variables.eventId] });
    },
  });
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      token, 
      status, 
      companion_ids 
    }: { 
      token: string; 
      status: InviteStatus; 
      companion_ids?: string[] 
    }) => {
      return await publicApi.respondInvite(token, {
        status,
        companionIds: companion_ids
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guest', variables.token] });
    },
  });
}

export function useMarkInviteViewed() {
  return useMutation({
    mutationFn: async (_guestId: string) => {
      // The ASP.NET Core backend marks invite as viewed automatically when fetched by token
      return true;
    },
  });
}

export function useRegenerateToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, eventId }: { guestId: string; eventId: string }) => {
      const { data } = await api.post<{ token: string }>(`/events/${eventId}/guests/${guestId}/regenerate-token`);
      return data.token;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}