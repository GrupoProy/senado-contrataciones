import { apiClient } from '@/lib/api-client';
import type { LoginInput, LoginResponse, MiPerfil } from '../types/auth-types';

export const authApi = {
  login: (input: LoginInput) => apiClient.post<LoginResponse>('/auth/login', input),
  logout: () => apiClient.post<{ message: string }>('auth/logout'),
  miPerfil: () => apiClient.get<MiPerfil>('auth/mi-perfil'),
  refrescar: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('auth/refresh', {
      refreshToken,
    }),
};
