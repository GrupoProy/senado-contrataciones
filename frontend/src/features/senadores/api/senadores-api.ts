import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { Senador, SenadoresQuery, CrearSenadorInput } from '../types/senador-types';

export const senadoresApi = {
  listar: (query: SenadoresQuery = {}) =>
    apiClient.get<PaginatedResponse<Senador>>('/senadores', query),
  obtener: (id: number) => apiClient.get<Senador>(`/senadores/${id}`),
  crear: (input: CrearSenadorInput) => apiClient.post<Senador>('/senadores', input),
  actualizar: (id: number, input: Partial<CrearSenadorInput>) =>
    apiClient.put<{ message: string }>(`/senadores/${id}`, input),
  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/senadores/${id}/estado`, { estado }),
  eliminar: (id: number) => apiClient.delete<{ message: string }>(`/senadores/${id}`),
};
