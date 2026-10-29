import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { unidadesApi } from '../api/unidades-api';
import { getErrorMessage } from '@/lib/api-client';
import type { CrearUnidadInput } from '../types/unidad-types';

export function useUnidades(opts: { soloActivas?: boolean } = {}) {
  return useQuery({
    queryKey: ['unidades', opts],
    queryFn: () => unidadesApi.listar(opts),
    staleTime: 5 * 60_000,
  });
}

export function useCrearUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearUnidadInput) => unidadesApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unidades'] });
      toast.success('Unidad creada');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CrearUnidadInput> }) =>
      unidadesApi.actualizar(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unidades'] });
      toast.success('Unidad actualizada');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      unidadesApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unidades'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
