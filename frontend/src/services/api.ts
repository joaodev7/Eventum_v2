import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@eventum:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@eventum:token');
      localStorage.removeItem('@eventum:user');
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/superadmin')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);
