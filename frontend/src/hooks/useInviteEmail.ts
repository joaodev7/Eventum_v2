import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests';
import { toast } from 'sonner';

interface SendInviteEmailParams {
  guest_ids: string[];
  event_id: string;
}

interface SendEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  details: {
    success: string[];
    failed: { id: string; error: string }[];
  };
}

export function useSendInviteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guest_ids, event_id }: SendInviteEmailParams): Promise<SendEmailResult> => {
      const res = await guestsApi.sendEmails(event_id, guest_ids);
      return {
        success: true,
        sent: res.sentCount,
        failed: 0,
        details: {
          success: guest_ids,
          failed: [],
        },
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.event_id] });

      if (data.sent > 0 && data.failed === 0) {
        toast.success(`${data.sent} convite(s) enviado(s) com sucesso!`);
      } else if (data.sent > 0 && data.failed > 0) {
        toast.warning(`${data.sent} enviado(s), ${data.failed} falhou(aram)`);
      } else if (data.sent === 0) {
        toast.error('Nenhum convite foi enviado');
      }
    },
    onError: (error: Error) => {
      console.error('Error sending invite emails:', error);
      toast.error(error.message || 'Erro ao enviar convites por email');
    },
  });
}
