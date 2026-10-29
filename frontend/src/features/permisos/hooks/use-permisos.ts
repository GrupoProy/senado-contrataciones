import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { permisosApi } from '../api/permisos-api';
import { getErrorMessage } from '@/lib/api-client';

export function usePermisos() {
  return useQuery({
    queryKey: ['permisos'],
    queryFn: () => permisosApi.listar(),
  });
}

export function useCrearPermiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: permisosApi.crear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permisos'] });
      toast.success('Permiso creado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoPermiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      permisosApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permisos'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
