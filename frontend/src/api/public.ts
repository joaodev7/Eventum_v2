import { api } from './client';
import { GiftDto } from './gifts';

export interface PublicInviteGuestDto {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  guestGroup?: string;
  status: string;
  companions: number;
  tableName?: string | null;
  tableId?: string | null;
  token?: string;
  hasViewed?: boolean;
  notes?: string | null;
  companionsList: { id: string; guestId: string; name: string; willAttend?: boolean | null }[];
}

export interface PublicEventDto {
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
  themeConfigJson?: string;
  settingsJson?: string;
}

export interface PublicInviteResponse {
  guest: PublicInviteGuestDto;
  event: PublicEventDto;
}

export interface PublicReconfirmationGuestDto {
  id: string;
  name: string;
  status: string;
  secondConfirmationStatus?: string | null;
  secondConfirmationCompanions: number;
  companionsList: { id: string; guestId: string; name: string; willAttend?: boolean | null }[];
}

export interface PublicReconfirmationResponse {
  guest: PublicReconfirmationGuestDto;
  event: PublicEventDto;
}

export interface PixConfigDto {
  id: string;
  eventId: string;
  pixKey: string;
  pixKeyType: string;
  merchantName: string;
  merchantCity: string;
  qrCodeImageUrl?: string | null;
}

export interface PublicGiftsResponse {
  gifts: GiftDto[];
  pixConfig?: PixConfigDto | null;
}

export const publicApi = {
  getInvite: async (token: string): Promise<PublicInviteResponse> => {
    const { data } = await api.get<PublicInviteResponse>(`/public/invite/${token}`);
    return data;
  },

  respondInvite: async (token: string, payload: { status: string; companionIds?: string[] }): Promise<{ success: boolean }> => {
    const { data } = await api.post<{ success: boolean }>(`/public/invite/${token}/respond`, payload);
    return data;
  },

  getReconfirmation: async (token: string): Promise<PublicReconfirmationResponse> => {
    const { data } = await api.get<PublicReconfirmationResponse>(`/public/reconfirmation/${token}`);
    return data;
  },

  respondReconfirmation: async (token: string, payload: { status: string; companionIds?: string[] }): Promise<{ success: boolean }> => {
    const { data } = await api.post<{ success: boolean }>(`/public/reconfirmation/${token}/respond`, payload);
    return data;
  },

  getPublicEvent: async (slug: string): Promise<PublicEventDto> => {
    const { data } = await api.get<PublicEventDto>(`/public/events/${slug}`);
    return data;
  },

  getPublicGifts: async (slug: string): Promise<PublicGiftsResponse> => {
    const { data } = await api.get<PublicGiftsResponse>(`/public/events/${slug}/gifts`);
    return data;
  },

  reserveGift: async (giftId: string): Promise<{ success: boolean }> => {
    const { data } = await api.post<{ success: boolean }>(`/public/gifts/${giftId}/reserve`);
    return data;
  },

  payPixGift: async (giftId: string, payload: { guestName: string; message?: string; eventId: string }): Promise<any> => {
    const { data } = await api.post<any>(`/public/gifts/${giftId}/pay-pix`, payload);
    return data;
  },

  createMercadoPagoPayment: async (eventId: string, payload: { giftId: string; giftName: string; giftValue: number; guestName?: string; message?: string }): Promise<any> => {
    const { data } = await api.post<any>(`/public/events/${eventId}/mercadopago/create-payment`, payload);
    return data;
  }
};
