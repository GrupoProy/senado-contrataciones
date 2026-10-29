import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { Auditoria, AuditoriaQuery } from '../types/auditoria-types';

export const auditoriaApi = {
  listar: (query: AuditoriaQuery = {}) =>
    apiClient.get<PaginatedResponse<Auditoria>>('/auditoria', query),
};
