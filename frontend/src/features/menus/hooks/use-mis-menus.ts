import { useQuery } from '@tanstack/react-query';
import { menusApi } from '../api/menus-api';
// ✅ 1. Importamos el store para obtener el ID del usuario
import { useAuthStore } from '@/stores/auth-store';

export function useMisMenus() {
  // ✅ 2. Leemos el ID del usuario logueado
  const usuarioId = useAuthStore((state) => state.usuario?.id);

  return useQuery({
    // ✅ 3. Añadimos el usuarioId a la queryKey
    queryKey: ['menus', 'mis-menus', usuarioId],
    queryFn: () => menusApi.misMenus(),
    // Solo se ejecuta si hay un usuario logueado
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}
