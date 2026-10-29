import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contratosApi } from '../api/contratos-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  ContratosQuery,
  CrearContratoInput,
  ActualizarContratoInput,
  EstadoContrato,
} from '../types/contrato-types';

export function useContratos(query: ContratosQuery) {
  return useQuery({
    queryKey: ['contratos', query],
    queryFn: () => contratosApi.listar(query),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useContrato(id: number | null) {
  return useQuery({
    queryKey: ['contratos', id],
    queryFn: () => contratosApi.obtener(id!),
    enabled: !!id,
  });
}

export function useRequerimientosDisponibles() {
  return useQuery({
    queryKey: ['contratos', 'requerimientos-disponibles'],
    queryFn: () => contratosApi.listarRequerimientosDisponibles(),
    staleTime: 30_000,
  });
}

export function useCrearContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearContratoInput) => contratosApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      qc.invalidateQueries({ queryKey: ['requerimientos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Contrato registrado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ActualizarContratoInput }) =>
      contratosApi.actualizar(id, input),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      qc.invalidateQueries({ queryKey: ['contratos', v.id] });
      toast.success('Contrato actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estadoCodigo,
      motivo,
    }: {
      id: number;
      estadoCodigo: EstadoContrato;
      motivo: string;
    }) => contratosApi.cambiarEstado(id, estadoCodigo, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Estado del contrato actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
