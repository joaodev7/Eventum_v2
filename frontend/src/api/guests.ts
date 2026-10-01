import { api } from './client';

export interface GuestCompanionDto {
  id: string;
  guestId: string;
  name: string;
  willAttend?: boolean | null;
}

export interface GuestDto {
  id: string;
  eventId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  guestGroup: string;
  tableId?: string | null;
  tableName?: string | null;
  token: string;
  status: string;
  companions: number;
  hasViewed: boolean;
  notes?: string | null;
  companionsList: GuestCompanionDto[];
}

export interface GuestMetricsDto {
  total: number;
  totalGuests: number;
  totalCompanions: number;
  accepted: number;
  declined: number;
  pending: number;
  viewed: number;
}

export const guestsApi = {
  getGuests: async (eventId: string, params?: { status?: string; group?: string; search?: string }): Promise<GuestDto[]> => {
    const { data } = await api.get<GuestDto[]>(`/events/${eventId}/guests`, { params });
    return data;
  },

  getMetrics: async (eventId: string): Promise<GuestMetricsDto> => {
    const { data } = await api.get<GuestMetricsDto>(`/events/${eventId}/guests/metrics`);
    return data;
  },

  createGuest: async (eventId: string, payload: any): Promise<GuestDto> => {
    const { data } = await api.post<GuestDto>(`/events/${eventId}/guests`, payload);
    return data;
  },

  updateGuest: async (eventId: string, id: string, payload: any): Promise<GuestDto> => {
    const { data } = await api.put<GuestDto>(`/events/${eventId}/guests/${id}`, payload);
    return data;
  },

  deleteGuest: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/events/${eventId}/guests/${id}`);
  },

  sendEmails: async (eventId: string, guestIds: string[]): Promise<{ sentCount: number }> => {
    const { data } = await api.post<{ sentCount: number }>(`/events/${eventId}/guests/send-emails`, { guestIds });
    return data;
  },

  sendSecondConfirmation: async (eventId: string, payload: { all: boolean; guestId?: string | null }): Promise<{ sentCount: number }> => {
    const { data } = await api.post<{ sentCount: number }>(`/events/${eventId}/guests/send-second-confirmation`, payload);
    return data;
  }
};
