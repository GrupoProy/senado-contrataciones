import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parametrosApi } from '../api/parametros-api';
import { getErrorMessage } from '@/lib/api-client';

export function useParametros(grupo?: string) {
  return useQuery({
    queryKey: ['parametros', grupo],
    queryFn: async () => {
      const res: any = await parametrosApi.listar(grupo);
      return (res?.data || res) as any[]; // Manejamos si viene envuelto en data
    },
  });
}

export function useActualizarParametro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      parametrosApi.actualizar(clave, valor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parametros'] });
      toast.success('Parámetro actualizado correctamente');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRecargarCache() {
  return useMutation({
    mutationFn: () => parametrosApi.recargarCache(),
    onSuccess: () => toast.success('Caché recargada correctamente'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
