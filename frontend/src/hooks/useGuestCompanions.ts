import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { publicApi } from '@/api/public';
import { GuestCompanion } from '@/lib/types';

export function useGuestCompanions(guestId: string) {
  return useQuery({
    queryKey: ['guest-companions', guestId],
    queryFn: async () => {
      if (!guestId) return [];
      try {
        const { data } = await api.get<GuestCompanion[]>(`/guests/${guestId}/companions`);
        return data;
      } catch {
        return [];
      }
    },
    enabled: !!guestId,
  });
}

export function useCreateCompanion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guest_id, name, event_id }: { guest_id: string; name: string; event_id: string }) => {
      const { data } = await api.post<GuestCompanion>(`/guests/${guest_id}/companions`, { name, event_id });
      return data;
    },
    onSuccess: (_, { guest_id }) => {
      queryClient.invalidateQueries({ queryKey: ['guest-companions', guest_id] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useDeleteCompanion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, guest_id }: { id: string; guest_id: string }) => {
      await api.delete(`/guests/${guest_id}/companions/${id}`);
      return { guest_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['guest-companions', result.guest_id] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useRespondWithCompanions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      token, 
      status, 
      companion_ids 
    }: { 
      token: string; 
      status: 'accepted' | 'declined'; 
      companion_ids: string[] 
    }) => {
      return await publicApi.respondInvite(token, {
        status,
        companionIds: companion_ids
      });
    },
    onSuccess: (_, { token }) => {
      queryClient.invalidateQueries({ queryKey: ['guest', token] });
    },
  });
}
