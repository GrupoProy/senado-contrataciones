import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type {
  Catalogo,
  CatalogoConDetalles,
  CatalogoDetalle,
  CatalogoDetalleItem,
  CatalogosQuery,
} from '../types/catalogo-types';

export const catalogosApi = {
  listar: (query: CatalogosQuery = {}) =>
    apiClient.get<PaginatedResponse<Catalogo>>('/catalogos', query),

  obtener: (id: number) => apiClient.get<CatalogoConDetalles>(`/catalogos/${id}`),

  obtenerPorCodigo: (codigo: string) =>
    apiClient.get<CatalogoDetalleItem[]>(`/catalogos/codigo/${codigo.toUpperCase()}`),

  crear: (input: { codigo: string; nombre: string; descripcion?: string | null }) =>
    apiClient.post<Catalogo>('/catalogos', input),

  actualizar: (id: number, input: { nombre?: string; descripcion?: string | null }) =>
    apiClient.put<{ message: string }>(`/catalogos/${id}`, input),

  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/catalogos/${id}/estado`, { estado }),

  crearDetalle: (
    catalogoId: number,
    input: {
      codigo: string;
      nombre: string;
      descripcion?: string | null;
      valor?: string | null;
      orden?: number;
    }
  ) => apiClient.post<CatalogoDetalle>(`/catalogos/${catalogoId}/detalles`, input),

  actualizarDetalle: (
    detalleId: number,
    input: {
      nombre?: string;
      descripcion?: string | null;
      valor?: string | null;
      orden?: number;
    }
  ) => apiClient.put<{ message: string }>(`/catalogos/detalles/${detalleId}`, input),

  cambiarEstadoDetalle: (detalleId: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/catalogos/detalles/${detalleId}/estado`, { estado }),
};
