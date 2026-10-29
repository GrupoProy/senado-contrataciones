import { apiClient } from '@/lib/api-client';
import type { Unidad, CrearUnidadInput } from '../types/unidad-types';

export const unidadesApi = {
  listar: (query: { soloActivas?: boolean } = {}) => apiClient.get<Unidad[]>('/unidades', query),

  obtenerPorId: (id: number) => apiClient.get<Unidad>(`/unidades/${id}`),

  arbol: () => apiClient.get<Unidad[]>('/unidades/arbol'),

  crear: (input: CrearUnidadInput) => apiClient.post<Unidad>('/unidades', input),

  actualizar: (id: number, input: Partial<CrearUnidadInput>) =>
    apiClient.put<{ message: string }>(`/unidades/${id}`, input),

  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/unidades/${id}/estado`, { estado }),
};
