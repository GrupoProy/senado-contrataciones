import { apiClient } from '@/lib/api-client';
import type { Permiso } from '../types/permiso-types';

export const permisosApi = {
  listar: () => apiClient.get<Permiso[]>('/permisos'),
  crear: (input: { clave: string; modulo: string; accion: string; descripcion?: string | null }) =>
    apiClient.post<Permiso>('/permisos', input),
  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/permisos/${id}/estado`, { estado }),
};
