import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { publicApi } from '@/api/public';
import { useToast } from '@/hooks/use-toast';

interface CreatePaymentParams {
  giftId: string;
  giftName: string;
  giftValue: number;
  guestName?: string;
  message?: string;
  eventId: string;
}

interface PaymentResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export function useCreateMercadoPagoPayment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreatePaymentParams): Promise<PaymentResponse> => {
      try {
        const res = await publicApi.createMercadoPagoPayment(params.eventId, {
          giftId: params.giftId,
          giftName: params.giftName,
          giftValue: params.giftValue,
          guestName: params.guestName,
          message: params.message,
        });
        return res;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || 'Erro ao processar pagamento');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMercadoPagoConnection(eventId: string | undefined) {
  return useQuery({
    queryKey: ['mercadopago-connection', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      try {
        const { data } = await api.get(`/events/${eventId}/mercadopago/connection`);
        return data;
      } catch {
        return null;
      }
    },
    enabled: !!eventId,
  });
}

export function useStartMercadoPagoOAuth() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post<{ authUrl: string }>(`/events/${eventId}/mercadopago/oauth-start`);
      return data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao iniciar conexão',
        description: error.response?.data?.error || error.message || 'Erro ao conectar ao Mercado Pago',
        variant: 'destructive',
      });
    },
  });
}

export function useProcessMercadoPagoCallback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      const { data } = await api.post<{ email?: string }>(`/mercadopago/oauth-callback`, { code, state });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-connection'] });
      toast({
        title: 'Mercado Pago conectado!',
        description: data.email ? `Conta: ${data.email}` : 'Conta conectada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao conectar',
        description: error.response?.data?.error || error.message || 'Erro ao conectar conta',
        variant: 'destructive',
      });
    },
  });
}

export function useDisconnectMercadoPago() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post(`/events/${eventId}/mercadopago/disconnect`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-connection'] });
      toast({
        title: 'Desconectado',
        description: 'Conta Mercado Pago desconectada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao desconectar',
        description: error.response?.data?.error || error.message || 'Erro ao desconectar conta',
        variant: 'destructive',
      });
    },
  });
}

export function useRefreshMercadoPagoToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post<{ refreshed: boolean }>(`/events/${eventId}/mercadopago/refresh-token`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-connection'] });
      toast({
        title: data.refreshed ? 'Token renovado!' : 'Token válido',
        description: data.refreshed ? 'Token atualizado com sucesso' : 'O token ainda está válido',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao renovar token',
        description: error.response?.data?.error || error.message || 'Erro ao renovar token',
        variant: 'destructive',
      });
    },
  });
}
