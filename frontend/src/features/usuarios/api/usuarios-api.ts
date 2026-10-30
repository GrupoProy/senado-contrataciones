import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type {
  Usuario,
  CrearUsuarioInput,
  UsuariosQuery,
  UsuarioRol,
  RolVigente,
} from '../types/usuario-types';

interface CrearUsuarioResponse {
  id: number;
  username: string;
  passwordTemporal: string;
  persona?: { id: number; fueCreada: boolean; mensaje: string };
  mensaje: string;
}

export const usuariosApi = {
  listar: (query: UsuariosQuery = {}) =>
    apiClient.get<PaginatedResponse<Usuario>>('/usuarios', query),

  obtener: (id: number) => apiClient.get<Usuario>(`/usuarios/${id}`),

  crear: (input: CrearUsuarioInput) => apiClient.post<CrearUsuarioResponse>('/usuarios', input),

  actualizar: (id: number, input: Partial<CrearUsuarioInput>) =>
    apiClient.put<{ message: string }>(`/usuarios/${id}`, input),

  cambiarEstado: (id: number, estado: string, motivo: string) =>
    apiClient.patch<{ message: string }>(`/usuarios/${id}/estado`, { estado, motivo }),

  resetPassword: (id: number, motivo: string) =>
    apiClient.post<{ username: string; passwordTemporal: string; mensaje: string }>(
      `/usuarios/${id}/reset-password`,
      { motivo }
    ),

  obtenerRolVigente: (id: number) =>
    apiClient.get<{ usuarioId: number; username: string; rolVigente: RolVigente | null }>(
      `/usuarios/${id}/rol-vigente`
    ),

  listarRoles: (id: number) =>
    apiClient.get<{ usuarioId: number; username: string; roles: UsuarioRol[] }>(
      `/usuarios/${id}/roles`
    ),

  asignarRol: (id: number, rolId: number, motivo: string) =>
    apiClient.post<{ message: string; usuarioRolId: number }>(`/usuarios/${id}/roles`, {
      rolId,
      motivo,
    }),

  inactivarRol: (id: number, motivo: string) =>
    apiClient.delete<{ message: string }>(`/usuarios/${id}/roles/vigente`, { motivo }),

  reactivarRol: (id: number, usuarioRolId: number, motivo: string) =>
    apiClient.patch<{ message: string }>(`/usuarios/${id}/roles/${usuarioRolId}/reactivar`, {
      motivo,
    }),

  desbloquear: (id: number) =>
    apiClient.patch<{ success: boolean; message: string }>(`/usuarios/${id}/desbloquear`, {}),
};
