import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { senadoresApi } from '../api/senadores-api';
import { getErrorMessage } from '@/lib/api-client';
import type { SenadoresQuery, CrearSenadorInput } from '../types/senador-types';

export function useSenadores(query: SenadoresQuery = {}) {
  return useQuery({
    queryKey: ['senadores', query],
    queryFn: () => senadoresApi.listar(query),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useCrearSenador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearSenadorInput) => senadoresApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['senadores'] });
      toast.success('Senador registrado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarSenador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CrearSenadorInput> }) =>
      senadoresApi.actualizar(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['senadores'] });
      toast.success('Senador actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoSenador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      senadoresApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['senadores'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useEliminarSenador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => senadoresApi.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['senadores'] });
      toast.success('Senador eliminado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
