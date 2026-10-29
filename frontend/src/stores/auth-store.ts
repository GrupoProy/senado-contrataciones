import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  unidadId: number | null;
  rol: {
    id: number;
    codigo: string;
    nombre: string;
  };
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  permisos: string[];
  debeCambiarPassword: boolean;

  setSession: (params: {
    token: string;
    refreshToken: string;
    usuario: Usuario;
    debeCambiarPassword: boolean;
  }) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setPermisos: (permisos: string[]) => void;
  setDebeCambiarPassword: (v: boolean) => void;
  logout: () => void;

  // Helpers
  hasPermission: (permiso: string) => boolean;
  hasAnyPermission: (...permisos: string[]) => boolean;
  hasAllPermissions: (...permisos: string[]) => boolean;
  hasRole: (rolCodigo: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      usuario: null,
      permisos: [],
      debeCambiarPassword: false,

      setSession: ({ token, refreshToken, usuario, debeCambiarPassword }) =>
        set({ token, refreshToken, usuario, debeCambiarPassword }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      setPermisos: (permisos) => set({ permisos }),

      setDebeCambiarPassword: (v) => set({ debeCambiarPassword: v }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          usuario: null,
          permisos: [],
          debeCambiarPassword: false,
        }),

      // ─── Helpers ─────────────────────────────────────────────────
      hasPermission: (permiso: string) => {
        const { usuario, permisos } = get();
        if (usuario?.rol.codigo === 'ADMINISTRADOR') return true;
        return permisos.includes(permiso);
      },

      hasAnyPermission: (...permisosRequeridos: string[]) => {
        const { usuario, permisos } = get();
        if (usuario?.rol.codigo === 'ADMINISTRADOR') return true;
        return permisosRequeridos.some((p) => permisos.includes(p));
      },

      hasAllPermissions: (...permisosRequeridos: string[]) => {
        const { usuario, permisos } = get();
        if (usuario?.rol.codigo === 'ADMINISTRADOR') return true;
        return permisosRequeridos.every((p) => permisos.includes(p));
      },

      hasRole: (rolCodigo: string) => {
        const { usuario } = get();
        return usuario?.rol.codigo === rolCodigo;
      },

      isAdmin: () => {
        const { usuario } = get();
        return usuario?.rol.codigo === 'ADMINISTRADOR';
      },
    }),
    {
      name: 'contrataciones-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
