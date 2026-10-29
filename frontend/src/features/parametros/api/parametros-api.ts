import { apiClient } from '@/lib/api-client';
import type { Parametro } from '../types/parametro-types';

export const parametrosApi = {
  listar: (grupo?: string) => apiClient.get<Parametro[]>('/parametros', { grupo }),

  actualizar: (clave: string, valor: string) =>
    apiClient.put<{ message: string }>(`/parametros/${clave}`, { valor }),

  recargarCache: () => apiClient.post<{ message: string }>('/parametros/recargar-cache', {}),
};
