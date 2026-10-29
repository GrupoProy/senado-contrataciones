import { apiClient } from '@/lib/api-client';
import type { Rol, CrearRolInput } from '../types/rol-types';

export const rolesApi = {
  listar: () => apiClient.get<Rol[]>('/roles'),
  obtener: (id: number) => apiClient.get<Rol>(`/roles/${id}`),
  crear: (input: CrearRolInput) => apiClient.post<Rol>('/roles', input),
  actualizar: (id: number, input: Partial<CrearRolInput>) =>
    apiClient.put<{ message: string }>(`/roles/${id}`, input),
  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/roles/${id}/estado`, { estado }),
};
