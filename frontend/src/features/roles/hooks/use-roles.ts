import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { rolesApi } from '../api/roles-api';
import { getErrorMessage } from '@/lib/api-client';
import type { CrearRolInput } from '../types/rol-types';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.listar(),
    staleTime: 60_000,
  });
}

export function useCrearRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearRolInput) => rolesApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol creado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CrearRolInput> }) =>
      rolesApi.actualizar(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rol actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      rolesApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
