import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/api/suppliers';

export interface Supplier {
  id: string;
  event_id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  address: string | null;
  notes: string | null;
  contracted: boolean;
  contract_value: number | null;
  paid_amount: number;
  created_at: string;
  updated_at: string;
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<SupplierInsert> & { id: string };

export function useSuppliers(eventId?: string) {
  return useQuery({
    queryKey: ['suppliers', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await suppliersApi.getSuppliers(eventId);
      return data.map((s: any): Supplier => ({
        id: s.id,
        event_id: s.eventId || eventId,
        name: s.name,
        category: s.category || null,
        contact_name: s.contactName || null,
        phone: s.phone || null,
        email: s.email || null,
        website: s.website || null,
        instagram: s.instagram || null,
        address: s.address || null,
        notes: s.notes || null,
        contracted: s.contracted || false,
        contract_value: s.contractValue || null,
        paid_amount: s.paidAmount || 0,
        created_at: s.createdAt,
        updated_at: s.updatedAt,
      }));
    },
    enabled: !!eventId,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const payload = {
        name: supplier.name,
        category: supplier.category,
        contactName: supplier.contact_name,
        phone: supplier.phone,
        email: supplier.email,
        website: supplier.website,
        instagram: supplier.instagram,
        address: supplier.address,
        notes: supplier.notes,
        contracted: supplier.contracted,
        contractValue: supplier.contract_value,
        paidAmount: supplier.paid_amount,
      };
      const data = await suppliersApi.createSupplier(supplier.event_id, payload as any);
      return {
        id: data.id,
        event_id: supplier.event_id,
        name: data.name,
        category: data.category || null,
        contact_name: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        instagram: data.instagram || null,
        address: data.address || null,
        notes: data.notes || null,
        contracted: data.contracted || false,
        contract_value: data.contractValue || null,
        paid_amount: data.paidAmount || 0,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      } as Supplier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.event_id] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: SupplierUpdate) => {
      const eventId = updates.event_id;
      if (!eventId) throw new Error('event_id is required');

      const payload = {
        name: updates.name,
        category: updates.category,
        contactName: updates.contact_name,
        phone: updates.phone,
        email: updates.email,
        website: updates.website,
        instagram: updates.instagram,
        address: updates.address,
        notes: updates.notes,
        contracted: updates.contracted,
        contractValue: updates.contract_value,
        paidAmount: updates.paid_amount,
      };
      const data = await suppliersApi.updateSupplier(eventId, id, payload as any);
      return {
        id: data.id,
        event_id: eventId,
        name: data.name,
        category: data.category || null,
        contact_name: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        instagram: data.instagram || null,
        address: data.address || null,
        notes: data.notes || null,
        contracted: data.contracted || false,
        contract_value: data.contractValue || null,
        paid_amount: data.paidAmount || 0,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      } as Supplier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.event_id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await suppliersApi.deleteSupplier(eventId, id);
      return { id, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.eventId] });
    },
  });
}

export const supplierCategories = [
  'Buffet',
  'Decoração',
  'Fotografia',
  'Vídeo',
  'DJ/Música',
  'Banda',
  'Cerimonial',
  'Florista',
  'Bolo',
  'Doces',
  'Bebidas',
  'Iluminação',
  'Som',
  'Transporte',
  'Convites',
  'Lembrancinhas',
  'Beleza/Maquiagem',
  'Vestuário',
  'Joias/Alianças',
  'Local/Espaço',
  'Mobiliário',
  'Outro',
] as const;
