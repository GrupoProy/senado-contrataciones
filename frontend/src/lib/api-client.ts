import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth-store';
import type { ApiResponse } from '@/types/api';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<
          ApiResponse<{
            accessToken: string;
            refreshToken: string;
          }>
        >(`${env.apiUrl}/auth/refresh`, { refreshToken });

        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);

        queue.forEach((cb) => cb(data.data.accessToken));
        queue = [];

        if (original.headers) original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = {
  async get<T>(url: string, params?: object): Promise<T> {
    const { data } = await api.get<ApiResponse<T>>(url, { params });
    return data.data;
  },
  async post<T>(url: string, body?: object): Promise<T> {
    const { data } = await api.post<ApiResponse<T>>(url, body);
    return data.data;
  },
  async put<T>(url: string, body?: object): Promise<T> {
    const { data } = await api.put<ApiResponse<T>>(url, body);
    return data.data;
  },
  async patch<T>(url: string, body?: object): Promise<T> {
    const { data } = await api.patch<ApiResponse<T>>(url, body);
    return data.data;
  },
  async delete<T>(url: string, body?: object): Promise<T> {
    const { data } = await api.delete<ApiResponse<T>>(url, { data: body });
    return data.data;
  },
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          error?: {
            message?: string;
            code?: string;
            details?: Array<{ campo: string; mensaje: string }>;
          };
        }
      | undefined;

    // Si Zod devuelve un array de detalles (errores específicos por campo)
    if (
      data?.error?.details &&
      Array.isArray(data.error.details) &&
      data.error.details.length > 0
    ) {
      // Unimos los mensajes de los campos que fallaron
      const mensajesEspecificos = data.error.details.map((d) => d.mensaje).join(' | ');
      return `Validación: ${mensajesEspecificos}`;
    }

    return data?.error?.message ?? error.message ?? 'Error desconocido';
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}
