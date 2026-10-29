import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosApi } from '../api/usuarios-api';
import { getErrorMessage } from '@/lib/api-client';
import type { CrearUsuarioInput, UsuariosQuery } from '../types/usuario-types';

export function useUsuarios(query: UsuariosQuery) {
  return useQuery({
    queryKey: ['usuarios', query],
    queryFn: () => usuariosApi.listar(query),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUsuario(id: number | null) {
  return useQuery({
    queryKey: ['usuarios', id],
    queryFn: () => usuariosApi.obtener(id!),
    enabled: !!id,
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearUsuarioInput) => usuariosApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, motivo }: { id: number; estado: string; motivo: string }) =>
      usuariosApi.cambiarEstado(id, estado, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useResetPasswordUsuario() {
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      usuariosApi.resetPassword(id, motivo),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRolVigente(id: number | null) {
  return useQuery({
    queryKey: ['usuarios', id, 'rol-vigente'],
    queryFn: () => usuariosApi.obtenerRolVigente(id!),
    enabled: !!id,
  });
}

export function useRolesDeUsuario(id: number | null) {
  return useQuery({
    queryKey: ['usuarios', id, 'roles'],
    queryFn: () => usuariosApi.listarRoles(id!),
    enabled: !!id,
  });
}

export function useAsignarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rolId, motivo }: { id: number; rolId: number; motivo: string }) =>
      usuariosApi.asignarRol(id, rolId, motivo),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['usuarios', vars.id, 'rol-vigente'] });
      qc.invalidateQueries({ queryKey: ['usuarios', vars.id, 'roles'] });
      toast.success('Rol asignado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useInactivarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      usuariosApi.inactivarRol(id, motivo),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['usuarios', vars.id, 'rol-vigente'] });
      qc.invalidateQueries({ queryKey: ['usuarios', vars.id, 'roles'] });
      toast.success('Rol inactivado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useReactivarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      usuarioRolId,
      motivo,
    }: {
      id: number;
      usuarioRolId: number;
      motivo: string;
    }) => usuariosApi.reactivarRol(id, usuarioRolId, motivo),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['usuarios', vars.id, 'rol-vigente'] });
      qc.invalidateQueries({ queryKey: ['usuarios', vars.id, 'roles'] });
      toast.success('Rol reactivado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
