import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('noura-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const session = parsed?.state?.session;
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        if (session?.user?.tenantId) {
          config.headers['x-tenant-id'] = session.user.tenantId;
        }
      }
    } catch {
      // ignore
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('noura-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
