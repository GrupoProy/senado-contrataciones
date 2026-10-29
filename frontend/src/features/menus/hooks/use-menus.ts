import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { menusApi } from '../api/menus-api';
import { getErrorMessage } from '@/lib/api-client';

export function useMenus() {
  return useQuery({ queryKey: ['menus-list'], queryFn: () => menusApi.listar() });
}

export function useCambiarEstadoMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      menusApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus-list'] });
      qc.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
