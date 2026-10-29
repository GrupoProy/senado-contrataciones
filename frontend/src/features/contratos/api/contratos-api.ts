import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type {
  Contrato,
  ContratosQuery,
  CrearContratoInput,
  ActualizarContratoInput,
  RequerimientoDisponible,
  EstadoContrato,
} from '../types/contrato-types';

export const contratosApi = {
  listar: (query: ContratosQuery = {}) =>
    apiClient.get<PaginatedResponse<Contrato>>('/contratos', query),

  obtener: (id: number) => apiClient.get<Contrato>(`/contratos/${id}`),

  crear: (input: CrearContratoInput) => apiClient.post<{ id: number }>('/contratos', input),

  actualizar: (id: number, input: ActualizarContratoInput) =>
    apiClient.put<{ message: string }>(`/contratos/${id}`, input),

  cambiarEstado: (id: number, estadoCodigo: EstadoContrato, motivo: string) =>
    apiClient.patch<{ message: string }>(`/contratos/${id}/estado`, {
      estadoCodigo,
      motivo,
    }),

  listarRequerimientosDisponibles: () =>
    apiClient.get<RequerimientoDisponible[]>('/contratos/requerimientos-disponibles'),
};
