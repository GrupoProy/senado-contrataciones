import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { matrizApi } from '../api/matriz-api';
import { getErrorMessage } from '@/lib/api-client';

export function useMatrizRol(rolId: number | null) {
  return useQuery({
    queryKey: ['matriz', rolId],
    queryFn: () => matrizApi.obtenerPorRol(rolId!),
    enabled: !!rolId,
  });
}

export function useSincronizarMatriz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rolId,
      permisos,
      menus,
    }: {
      rolId: number;
      permisos: number[];
      menus: number[];
    }) => matrizApi.sincronizar(rolId, permisos, menus),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['matriz', v.rolId] });
      toast.success('Matriz actualizada correctamente');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
