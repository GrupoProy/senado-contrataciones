import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cargosApi, type CrearCargoInput } from '../api/cargos-api';
import { getErrorMessage } from '@/lib/api-client';
import type { CargosQuery } from '../types/cargo-types';

export function useCargos(query: CargosQuery = {}) {
  return useQuery({
    queryKey: ['cargos', query],
    queryFn: () => cargosApi.listar(query),
    staleTime: 5 * 60_000,
  });
}

export function useCrearCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCargoInput) => cargosApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Cargo registrado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CrearCargoInput> }) =>
      cargosApi.actualizar(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Cargo actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      cargosApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
