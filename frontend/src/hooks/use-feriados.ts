// src/features/hooks/use-feriados.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Feriado {
  fecha: string;
}

export function useFeriados() {
  return useQuery({
    queryKey: ['feriados'],
    queryFn: () => apiClient.get<Feriado[]>('/feriados'),
    staleTime: 1000 * 60 * 60,
  });
}
