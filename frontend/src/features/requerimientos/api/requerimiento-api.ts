import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type {
  Requerimiento,
  CrearRequerimientoInput,
  RequerimientosQuery,
  BuscarPersonaResponse,
  ProcesoActivo,
  DerivarInput,
  DerivarMasivoInput,
  DerivarResponse,
  DerivarMasivoResponse,
  ConsultarRequerimientosQuery,
} from '../types/requerimiento-types';

export const requerimientoApi = {
  listar: (query: RequerimientosQuery = {}) =>
    apiClient.get<PaginatedResponse<Requerimiento>>('/requerimientos', query),

  obtener: (id: number) => apiClient.get<Requerimiento>(`/requerimientos/${id}`),

  crear: (input: CrearRequerimientoInput) =>
    apiClient.post<{
      id: number;
      estadoCodigo: string;
      codigo: string | null;
      unidadActualId: number;
      persona: { id: number; fueCreada: boolean; mensaje: string };
      mensaje: string;
    }>('/requerimientos', input),

  actualizar: (id: number, input: Partial<CrearRequerimientoInput>) =>
    apiClient.put<{ message: string }>(`/requerimientos/${id}`, input),

  bandeja: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<Requerimiento>>('/requerimientos/bandeja', { page, limit }),

  bandejaDerivar: () => apiClient.get<Requerimiento[]>('/requerimientos/bandeja-derivar'),

  buscarPersona: (tipoDocumento: string, numeroDocumento: string, complemento?: string | null) =>
    apiClient.get<BuscarPersonaResponse>('/requerimientos/persona/buscar', {
      tipoDocumento,
      numeroDocumento,
      complemento: complemento ?? undefined,
    }),

  procesoActivoPersona: (personaId: number, excludeRequerimientoId?: number) =>
    apiClient.get<ProcesoActivo>(`/requerimientos/persona/${personaId}/activo`, {
      excludeRequerimientoId,
    }),

  derivar: (id: number, input: DerivarInput) =>
    apiClient.post<DerivarResponse>(`/requerimientos/${id}/derivar`, input),

  derivarMasivo: (input: DerivarMasivoInput) =>
    apiClient.post<DerivarMasivoResponse>('/requerimientos/derivar-masivo', input),

  obtenerEstadisticas: () => apiClient.get<Record<string, number>>('/requerimientos/stats'),

  consultar: (query: ConsultarRequerimientosQuery = {}) =>
    apiClient.get<PaginatedResponse<Requerimiento>>('/requerimientos/consultas', query),
};
