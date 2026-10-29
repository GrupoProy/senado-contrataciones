import { apiClient } from '@/lib/api-client';
import type { Flujo, Transicion } from '../types/flujo-types';

export const flujosApi = {
  listar: () => apiClient.get<Flujo[]>('/flujos'),
  listarTransiciones: (flujoId: number) =>
    apiClient.get<Transicion[]>(`/flujos/${flujoId}/transiciones`),
};
