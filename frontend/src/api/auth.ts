import { api } from './client';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
  roles: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, fullName });
    return data;
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  updateProfile: async (payload: { fullName?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<User> => {
    const { data } = await api.put<User>('/auth/profile', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('@eventum:refreshToken') || '';
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('@eventum:token');
    localStorage.removeItem('@eventum:refreshToken');
    localStorage.removeItem('@eventum:user');
  }
};
