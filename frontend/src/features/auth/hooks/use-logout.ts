import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export function useLogout() {
  const logoutStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = () => {
    // 1. Limpiamos el estado de Zustand (usuario, token, permisos)
    logoutStore();

    // 2. ✅ DESTRUIMOS LA CACHÉ DE REACT QUERY (Evita persistencia de menús y datos)
    queryClient.clear();

    // 3. Redirigimos al login
    navigate('/login', { replace: true });
  };

  return logout;
}
