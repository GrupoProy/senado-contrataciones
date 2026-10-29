import { apiClient } from '@/lib/api-client';
import type { MatrizRol } from '../types/matriz-types';

export const matrizApi = {
  obtenerPorRol: (rolId: number) => apiClient.get<MatrizRol>(`/matriz/roles/${rolId}`),

  sincronizar: (rolId: number, permisos: number[], menus: number[]) =>
    apiClient.put<{ message: string }>(`/matriz/roles/${rolId}/sincronizar`, { permisos, menus }),
};
