import { api } from './client';

export interface TableDto {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  description?: string | null;
  assignedGuestsCount: number;
}

export const tablesApi = {
  getTables: async (eventId: string): Promise<TableDto[]> => {
    const { data } = await api.get<TableDto[]>(`/events/${eventId}/tables`);
    return data;
  },

  getTablesWithGuests: async (eventId: string): Promise<any[]> => {
    const { data } = await api.get<any[]>(`/events/${eventId}/tables/with-guests`);
    return data;
  },

  createTable: async (eventId: string, payload: { name: string; capacity: number; description?: string }): Promise<TableDto> => {
    const { data } = await api.post<TableDto>(`/events/${eventId}/tables`, payload);
    return data;
  },

  updateTable: async (eventId: string, id: string, payload: { name: string; capacity: number; description?: string }): Promise<TableDto> => {
    const { data } = await api.put<TableDto>(`/events/${eventId}/tables/${id}`, payload);
    return data;
  },

  deleteTable: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/events/${eventId}/tables/${id}`);
  }
};
