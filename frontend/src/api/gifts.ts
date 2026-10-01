import { api } from './client';

export interface GiftDto {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  value: number;
  imageUrl?: string | null;
  status: string;
  isFlexibleValue: boolean;
  minValue?: number | null;
}

export const giftsApi = {
  getGifts: async (eventId: string): Promise<GiftDto[]> => {
    const { data } = await api.get<GiftDto[]>(`/events/${eventId}/gifts`);
    return data;
  },

  createGift: async (eventId: string, payload: any): Promise<GiftDto> => {
    const { data } = await api.post<GiftDto>(`/events/${eventId}/gifts`, payload);
    return data;
  },

  updateGift: async (eventId: string, id: string, payload: any): Promise<GiftDto> => {
    const { data } = await api.put<GiftDto>(`/events/${eventId}/gifts/${id}`, payload);
    return data;
  },

  deleteGift: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/events/${eventId}/gifts/${id}`);
  },

  getPixConfig: async (eventId: string): Promise<any> => {
    const { data } = await api.get<any>(`/events/${eventId}/pix`);
    return data;
  },

  updatePixConfig: async (eventId: string, payload: any): Promise<any> => {
    const { data } = await api.put<any>(`/events/${eventId}/pix`, payload);
    return data;
  },

  getPayments: async (eventId: string): Promise<any[]> => {
    const { data } = await api.get<any[]>(`/events/${eventId}/gift-payments`);
    return data;
  },

  approvePayment: async (eventId: string, paymentId: string): Promise<void> => {
    await api.post(`/events/${eventId}/gift-payments/${paymentId}/approve`);
  }
};
