import { useAuthStore } from '@/stores/auth-store';

export function usePermission() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
  };
}
