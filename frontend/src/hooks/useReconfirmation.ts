import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicApi } from '@/api/public';
import { guestsApi } from '@/api/guests';
import { useEvent } from '@/contexts/EventContext';

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

export interface ReconfirmationGuest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  guest_group: 'family' | 'friends' | 'work' | 'other';
  status: 'pending' | 'accepted' | 'declined';
  companions: number;
  notes: string | null;
  table_id: string | null;
  has_viewed: boolean;
  viewed_at: string | null;
  responded_at: string | null;
  token: string;
  created_at: string;
  updated_at: string;
  second_confirmation_sent: boolean;
  second_confirmation_status: string | null;
  second_confirmation_responded_at: string | null;
  second_confirmation_companions: number | null;
  reconfirmation_token: string | null;
  event_id: string;
  companions_list?: { id: string; name: string; will_attend: boolean | null }[];
  event_info?: EventInfo | null;
}

export interface ReconfirmationMetrics {
  firstConfirmed: number;
  firstConfirmedGuests: number;
  firstConfirmedCompanions: number;
  secondConfirmed: number;
  secondConfirmedGuests: number;
  secondConfirmedCompanions: number;
  secondDeclined: number;
  secondDeclinedGuests: number;
  secondDeclinedCompanions: number;
  secondPending: number;
  secondPendingGuests: number;
  secondPendingCompanions: number;
  notSent: number;
  notSentGuests: number;
  notSentCompanions: number;
  totalConfirmedPeople: number;
  totalConfirmedGuests: number;
  totalConfirmedCompanions: number;
}

export function useGuestByReconfirmationToken(token: string) {
  return useQuery({
    queryKey: ['reconfirmation-guest', token],
    queryFn: async () => {
      const data = await publicApi.getReconfirmation(token);
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

      return {
        id: g.id,
        name: g.name,
        email: null,
        phone: null,
        guest_group: 'friends',
        status: (g.status?.toLowerCase() || 'accepted') as any,
        companions: g.secondConfirmationCompanions || 0,
        notes: null,
        table_id: null,
        has_viewed: true,
        viewed_at: null,
        responded_at: null,
        token: token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        second_confirmation_sent: true,
        second_confirmation_status: g.secondConfirmationStatus || null,
        second_confirmation_responded_at: null,
        second_confirmation_companions: g.secondConfirmationCompanions,
        reconfirmation_token: token,
        event_id: ev.id,
        companions_list: (g.companionsList || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          will_attend: c.willAttend ?? null,
        })),
        event_info: eventInfo,
      } as ReconfirmationGuest;
    },
    enabled: !!token,
  });
}

export function useRespondToReconfirmation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, status, companion_ids }: { token: string; status: 'accepted' | 'declined'; companion_ids?: string[] }) => {
      return await publicApi.respondReconfirmation(token, {
        status,
        companionIds: companion_ids,
      });
    },
    onSuccess: (_, { token }) => {
      queryClient.invalidateQueries({ queryKey: ['reconfirmation-guest', token] });
      queryClient.invalidateQueries({ queryKey: ['reconfirmation-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useSendSecondConfirmation() {
  const queryClient = useQueryClient();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async (guestId: string) => {
      const eventId = currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      return await guestsApi.sendSecondConfirmation(eventId, {
        all: false,
        guestId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['reconfirmation-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['guests-reconfirmation'] });
    },
  });
}

export function useSendSecondConfirmationToAll() {
  const queryClient = useQueryClient();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async () => {
      const eventId = currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      const res = await guestsApi.sendSecondConfirmation(eventId, {
        all: true,
      });
      return res.sentCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['reconfirmation-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['guests-reconfirmation'] });
    },
  });
}

export function useReconfirmationMetrics(eventId?: string) {
  return useQuery({
    queryKey: ['reconfirmation-metrics', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const guests = await guestsApi.getGuests(eventId);

      let firstConfirmedGuests = 0;
      let firstConfirmedCompanions = 0;
      let secondConfirmedGuests = 0;
      let secondConfirmedCompanions = 0;
      let secondDeclinedGuests = 0;
      let secondDeclinedCompanions = 0;
      let secondPendingGuests = 0;
      let secondPendingCompanions = 0;
      let notSentGuests = 0;
      let notSentCompanions = 0;

      guests.forEach((g: any) => {
        const isAccepted = g.status?.toLowerCase() === 'accepted';
        const compCount = g.companions || g.companionsList?.length || 0;

        if (isAccepted) {
          firstConfirmedGuests += 1;
          firstConfirmedCompanions += compCount;

          if (g.secondConfirmationSent) {
            const scStatus = g.secondConfirmationStatus?.toLowerCase();
            if (scStatus === 'accepted') {
              secondConfirmedGuests += 1;
              secondConfirmedCompanions += g.secondConfirmationCompanions ?? compCount;
            } else if (scStatus === 'declined') {
              secondDeclinedGuests += 1;
              secondDeclinedCompanions += compCount;
            } else {
              secondPendingGuests += 1;
              secondPendingCompanions += compCount;
            }
          } else {
            notSentGuests += 1;
            notSentCompanions += compCount;
          }
        }
      });

      const totalConfirmedGuests = secondConfirmedGuests + notSentGuests;
      const totalConfirmedCompanions = secondConfirmedCompanions + notSentCompanions;

      const metrics: ReconfirmationMetrics = {
        firstConfirmed: firstConfirmedGuests + firstConfirmedCompanions,
        firstConfirmedGuests,
        firstConfirmedCompanions,
        secondConfirmed: secondConfirmedGuests + secondConfirmedCompanions,
        secondConfirmedGuests,
        secondConfirmedCompanions,
        secondDeclined: secondDeclinedGuests + secondDeclinedCompanions,
        secondDeclinedGuests,
        secondDeclinedCompanions,
        secondPending: secondPendingGuests + secondPendingCompanions,
        secondPendingGuests,
        secondPendingCompanions,
        notSent: notSentGuests + notSentCompanions,
        notSentGuests,
        notSentCompanions,
        totalConfirmedPeople: totalConfirmedGuests + totalConfirmedCompanions,
        totalConfirmedGuests,
        totalConfirmedCompanions,
      };

      return metrics;
    },
    enabled: !!eventId,
  });
}

export function useGuestsForReconfirmation(eventId?: string) {
  return useQuery({
    queryKey: ['guests-reconfirmation', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const guests = await guestsApi.getGuests(eventId, { status: 'accepted' });
      return guests.map((g: any): ReconfirmationGuest => ({
        id: g.id,
        name: g.name,
        email: g.email || null,
        phone: g.phone || null,
        guest_group: (g.guestGroup?.toLowerCase() || 'other') as any,
        status: 'accepted',
        companions: g.companions || 0,
        notes: g.notes || null,
        table_id: g.tableId || null,
        has_viewed: g.hasViewed || false,
        viewed_at: g.viewedAt || null,
        responded_at: g.respondedAt || null,
        token: g.token,
        created_at: g.createdAt,
        updated_at: g.updatedAt,
        second_confirmation_sent: g.secondConfirmationSent || false,
        second_confirmation_status: g.secondConfirmationStatus || null,
        second_confirmation_responded_at: g.secondConfirmationRespondedAt || null,
        second_confirmation_companions: g.secondConfirmationCompanions || 0,
        reconfirmation_token: g.reconfirmationToken || null,
        event_id: g.eventId || eventId,
        companions_list: (g.companionsList || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          will_attend: c.willAttend ?? null,
        })),
      }));
    },
    enabled: !!eventId,
  });
}