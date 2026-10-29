import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/api-client';
import type { LoginInput } from '../types/auth-types';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const setPermisos = useAuthStore((s) => s.setPermisos);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async (data) => {
      queryClient.clear();
      setSession({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        usuario: data.usuario,
        debeCambiarPassword: data.debeCambiarPassword,
      });

      // Cargar permisos del usuario (mi-perfil los devuelve)
      try {
        const perfil = await authApi.miPerfil();
        setPermisos(perfil.permisos ?? []);
      } catch {
        // Si falla, seguimos sin permisos; el backend validará igual
        setPermisos([]);
      }

      toast.success(`Bienvenido, ${data.usuario.nombres}`);

      if (data.debeCambiarPassword) {
        navigate('/perfil/cambiar-password', { replace: true });
      } else {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
        navigate(from ?? '/dashboard', { replace: true });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
