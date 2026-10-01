import { api } from './client';

export interface EventDto {
  id: string;
  slug: string;
  eventType: string;
  eventName: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  venueMapsLink?: string | null;
  heroImageUrl?: string | null;
  inviteImageUrl?: string | null;
  welcomeMessage?: string | null;
  galleryImages: string[];
  themeConfigJson: string;
  settingsJson: string;
  status: string;
  userRole: string;
}

export const eventsApi = {
  getEvents: async (): Promise<EventDto[]> => {
    const { data } = await api.get<EventDto[]>('/events');
    return data;
  },

  getEventById: async (id: string): Promise<EventDto> => {
    const { data } = await api.get<EventDto>(`/events/${id}`);
    return data;
  },

  getEventBySlug: async (slug: string): Promise<EventDto> => {
    const { data } = await api.get<EventDto>(`/public/events/${slug}`);
    return data;
  },

  createEvent: async (payload: { eventName: string; eventType: string; eventDate?: string; eventTime?: string; venueName?: string; venueAddress?: string }): Promise<EventDto> => {
    const { data } = await api.post<EventDto>('/events', payload);
    return data;
  },

  updateEvent: async (id: string, payload: Partial<EventDto>): Promise<EventDto> => {
    const { data } = await api.put<EventDto>(`/events/${id}`, payload);
    return data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  }
};
