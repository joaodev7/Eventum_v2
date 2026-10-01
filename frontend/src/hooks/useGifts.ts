import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftsApi } from '@/api/gifts';
import { publicApi } from '@/api/public';
import { useToast } from '@/hooks/use-toast';
import { Gift, GiftPayment, PixConfig } from '@/lib/types';
import { useEvent } from '@/contexts/EventContext';

export function useGifts(eventId?: string) {
  return useQuery({
    queryKey: ['gifts', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await giftsApi.getGifts(eventId);
      return data.map((g: any): Gift => ({
        id: g.id,
        name: g.name,
        description: g.description || null,
        value: g.value,
        image_url: g.imageUrl || null,
        status: (g.status?.toLowerCase() || 'available') as 'available' | 'reserved' | 'received',
        reserved_at: g.reservedAt || null,
        event_id: g.eventId || eventId,
        is_flexible_value: g.isFlexibleValue || false,
        min_value: g.minValue || null,
        created_at: g.createdAt || new Date().toISOString(),
        updated_at: g.updatedAt || new Date().toISOString(),
      }));
    },
    enabled: !!eventId,
  });
}

export function useAvailableGifts(eventId?: string) {
  return useQuery({
    queryKey: ['gifts', 'available', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await giftsApi.getGifts(eventId);
      return data
        .filter((g: any) => g.status !== 'received')
        .map((g: any): Gift => ({
          id: g.id,
          name: g.name,
          description: g.description || null,
          value: g.value,
          image_url: g.imageUrl || null,
          status: (g.status?.toLowerCase() || 'available') as 'available' | 'reserved' | 'received',
          reserved_at: g.reservedAt || null,
          event_id: g.eventId || eventId,
          is_flexible_value: g.isFlexibleValue || false,
          min_value: g.minValue || null,
          created_at: g.createdAt || new Date().toISOString(),
          updated_at: g.updatedAt || new Date().toISOString(),
        }));
    },
    enabled: !!eventId,
  });
}

export function usePixConfig(eventId?: string) {
  return useQuery({
    queryKey: ['pix-config', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      try {
        const data = await giftsApi.getPixConfig(eventId);
        if (!data) return null;
        return {
          id: data.id,
          qr_code_url: data.qrCodeImageUrl || null,
          pix_key: data.pixKey || null,
          recipient_name: data.merchantName || null,
          event_id: data.eventId || eventId,
          created_at: data.createdAt || new Date().toISOString(),
          updated_at: data.updatedAt || new Date().toISOString(),
        } as PixConfig;
      } catch {
        return null;
      }
    },
    enabled: !!eventId,
  });
}

export function useGiftPayments(eventId?: string) {
  return useQuery({
    queryKey: ['gift-payments', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await giftsApi.getPayments(eventId);
      return data.map((p: any): GiftPayment & { gift: Gift } => ({
        id: p.id,
        gift_id: p.giftId,
        guest_name: p.guestName || null,
        message: p.message || null,
        status: (p.status?.toLowerCase() || 'pending') as 'pending' | 'confirmed',
        event_id: p.eventId || eventId,
        created_at: p.createdAt,
        confirmed_at: p.confirmedAt || null,
        gift: p.gift ? {
          id: p.gift.id,
          name: p.gift.name,
          description: p.gift.description || null,
          value: p.gift.value,
          image_url: p.gift.imageUrl || null,
          status: (p.gift.status?.toLowerCase() || 'available') as 'available' | 'reserved' | 'received',
          reserved_at: null,
          event_id: eventId,
          is_flexible_value: false,
          min_value: null,
          created_at: p.createdAt,
          updated_at: p.createdAt,
        } : ({} as Gift),
      }));
    },
    enabled: !!eventId,
  });
}

export function useCreateGift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async (gift: Omit<Gift, 'id' | 'created_at' | 'updated_at' | 'reserved_at'>) => {
      const eventId = gift.event_id || currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      const payload = {
        name: gift.name,
        description: gift.description,
        value: gift.value,
        imageUrl: gift.image_url,
        isFlexibleValue: gift.is_flexible_value || false,
        minValue: gift.min_value || null,
      };
      return await giftsApi.createGift(eventId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      toast({ title: 'Presente criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar presente', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateGift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Gift> & { id: string }) => {
      const eventId = updates.event_id || currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      const payload = {
        name: updates.name,
        description: updates.description,
        value: updates.value,
        imageUrl: updates.image_url,
        status: updates.status,
        isFlexibleValue: updates.is_flexible_value,
        minValue: updates.min_value,
      };
      return await giftsApi.updateGift(eventId, id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      toast({ title: 'Presente atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar presente', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteGift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async (id: string) => {
      const eventId = currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      await giftsApi.deleteGift(eventId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      toast({ title: 'Presente excluído!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir presente', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReserveGift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (giftId: string) => {
      return await publicApi.reserveGift(giftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao reservar presente', description: error.message, variant: 'destructive' });
    },
  });
}

export function useConfirmGiftPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ giftId, guestName, message, eventId }: { giftId: string; guestName?: string; message?: string; eventId?: string }) => {
      if (!eventId) throw new Error('Event ID is required');
      return await publicApi.payPixGift(giftId, {
        guestName: guestName || 'Convidado Anônimo',
        message,
        eventId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      toast({ title: 'Pagamento registrado!', description: 'Aguardando confirmação.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar pagamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const eventId = currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      await giftsApi.approvePayment(eventId, paymentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['gift-payments'] });
      toast({ title: 'Pagamento confirmado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao confirmar pagamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePixConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, ...config }: Partial<PixConfig> & { eventId: string }) => {
      const payload = {
        pixKey: config.pix_key,
        pixKeyType: 'cpf',
        merchantName: config.recipient_name,
        merchantCity: 'Sao Paulo',
        qrCodeImageUrl: config.qr_code_url,
      };
      return await giftsApi.updatePixConfig(eventId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-config'] });
      toast({ title: 'Configuração PIX atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar PIX', description: error.message, variant: 'destructive' });
    },
  });
}

export type { Gift, GiftPayment, PixConfig };
