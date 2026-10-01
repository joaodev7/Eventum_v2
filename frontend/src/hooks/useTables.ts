import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@/api/tables';
import { Table } from '@/lib/types';
import { useEvent } from '@/contexts/EventContext';

export interface TableWithGuests extends Table {
  guests: any[];
}

export function useTables(eventId?: string) {
  return useQuery({
    queryKey: ['tables', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await tablesApi.getTables(eventId);
      return data.map((t: any): Table => ({
        id: t.id,
        name: t.name,
        capacity: t.capacity,
        description: t.description || null,
        event_id: t.eventId || eventId,
        created_at: t.createdAt,
      }));
    },
    enabled: !!eventId,
  });
}

export function useTablesWithGuests(eventId?: string) {
  return useQuery({
    queryKey: ['tables-with-guests', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const data = await tablesApi.getTablesWithGuests(eventId);
      return data.map((t: any): TableWithGuests => ({
        id: t.id,
        name: t.name,
        capacity: t.capacity,
        description: t.description || null,
        event_id: t.eventId || eventId,
        created_at: t.createdAt,
        guests: (t.guests || []).map((g: any) => ({
          id: g.id,
          name: g.name,
          email: g.email || null,
          phone: g.phone || null,
          companions: g.companions || 0,
          status: g.status,
          table_id: t.id,
        })),
      }));
    },
    enabled: !!eventId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async (table: Omit<Table, 'id' | 'created_at'>) => {
      const eventId = table.event_id || currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      return await tablesApi.createTable(eventId, {
        name: table.name,
        capacity: table.capacity,
        description: table.description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-guests'] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Table> & { id: string }) => {
      const eventId = updates.event_id || currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      return await tablesApi.updateTable(eventId, id, {
        name: updates.name || '',
        capacity: updates.capacity || 0,
        description: updates.description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-guests'] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const { currentEvent } = useEvent();

  return useMutation({
    mutationFn: async (id: string) => {
      const eventId = currentEvent?.id;
      if (!eventId) throw new Error('Event ID is required');

      await tablesApi.deleteTable(eventId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
