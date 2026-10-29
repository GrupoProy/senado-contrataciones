import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard-api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.obtenerStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
