import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { personasApi } from '../api/personas-api';
import { getErrorMessage } from '@/lib/api-client';
import type { CrearPersonaInput, PersonasQuery } from '../types/persona-types';

export function usePersonas(query: PersonasQuery) {
  return useQuery({
    queryKey: ['personas', query],
    queryFn: () => personasApi.listar(query),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function usePersona(id: number | null) {
  return useQuery({
    queryKey: ['personas', id],
    queryFn: () => personasApi.obtener(id!),
    enabled: !!id,
  });
}

export function useCrearPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearPersonaInput) => personasApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona registrada');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CrearPersonaInput> }) =>
      personasApi.actualizar(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona actualizada');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useEliminarPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => personasApi.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona eliminada');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
