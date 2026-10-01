import { api } from './client';

export interface SupplierDto {
  id: string;
  eventId: string;
  name: string;
  category?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  address?: string | null;
  notes?: string | null;
  contracted: boolean;
  contractValue?: number | null;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateSupplierDto = Omit<SupplierDto, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSupplierDto = Partial<CreateSupplierDto>;

export const suppliersApi = {
  getSuppliers: async (eventId: string): Promise<SupplierDto[]> => {
    const { data } = await api.get<SupplierDto[]>(`/events/${eventId}/suppliers`);
    return data;
  },

  getSupplierById: async (eventId: string, id: string): Promise<SupplierDto> => {
    const { data } = await api.get<SupplierDto>(`/events/${eventId}/suppliers/${id}`);
    return data;
  },

  createSupplier: async (eventId: string, payload: CreateSupplierDto): Promise<SupplierDto> => {
    const { data } = await api.post<SupplierDto>(`/events/${eventId}/suppliers`, payload);
    return data;
  },

  updateSupplier: async (eventId: string, id: string, payload: UpdateSupplierDto): Promise<SupplierDto> => {
    const { data } = await api.put<SupplierDto>(`/events/${eventId}/suppliers/${id}`, payload);
    return data;
  },

  deleteSupplier: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/events/${eventId}/suppliers/${id}`);
  }
};
