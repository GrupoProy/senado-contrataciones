import { apiClient } from '@/lib/api-client';
import type { DashboardStats } from '../types/dashboard-types';

export const dashboardApi = {
  obtenerStats: async (): Promise<DashboardStats> => {
    // ✅ Usamos una petición directa
    const res: any = await apiClient.get('/dashboard/stats');
    // Si tu apiClient devuelve { success: true, data: {...} }, extraemos el data. Si no, devuelve el res directo.
    return res?.data || res;
  },
};
