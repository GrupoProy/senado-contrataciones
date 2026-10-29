import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { Persona, CrearPersonaInput, PersonasQuery } from '../types/persona-types';

export const personasApi = {
  listar: (query: PersonasQuery = {}) =>
    apiClient.get<PaginatedResponse<Persona>>('/personas', query),

  obtener: (id: number) => apiClient.get<Persona>(`/personas/${id}`),

  crear: (input: CrearPersonaInput) =>
    apiClient.post<{ id: number; creado: boolean }>('/personas', input),

  actualizar: (id: number, input: Partial<CrearPersonaInput>) =>
    apiClient.put<{ message: string }>(`/personas/${id}`, input),

  eliminar: (id: number) => apiClient.delete<{ message: string }>(`/personas/${id}`),
};
