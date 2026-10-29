import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { Cargo, CargosQuery } from '../types/cargo-types';

export interface CrearCargoInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  nivel: string;
  clase: string;
  salarioMes: number;
  unidadOrganizacionalId?: number | null;
}

export const cargosApi = {
  listar: (query: CargosQuery = {}) => apiClient.get<PaginatedResponse<Cargo>>('/cargos', query),

  crear: (input: CrearCargoInput) => apiClient.post<Cargo>('/cargos', input),

  actualizar: (id: number, input: Partial<CrearCargoInput>) =>
    apiClient.put<{ message: string }>(`/cargos/${id}`, input),

  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/cargos/${id}/estado`, { estado }),
};
