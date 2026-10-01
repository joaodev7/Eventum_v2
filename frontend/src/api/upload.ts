import { api } from './client';

export const uploadApi = {
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.url;
  },

  uploadEventImage: async (file: File, eventId?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>(
      '/upload/event-image',
      formData,
      {
        params: eventId ? { eventId } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return data.url;
  },

  deleteFile: async (fileUrl: string): Promise<boolean> => {
    const { data } = await api.delete<{ success: boolean }>('/upload', {
      params: { fileUrl }
    });
    return data.success;
  }
};
