import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { catalogosApi } from '../api/catalogos-api';
import { getErrorMessage } from '@/lib/api-client';
import type { CatalogosQuery } from '../types/catalogo-types';

/** Lista paginada de catálogos. */
export function useCatalogos(query: CatalogosQuery = {}) {
  return useQuery({
    queryKey: ['catalogos', query],
    queryFn: () => catalogosApi.listar(query),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Detalle de un catálogo por id (con sus detalles). */
export function useCatalogo(id: number | null) {
  return useQuery({
    queryKey: ['catalogos', id],
    queryFn: () => catalogosApi.obtener(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

/**
 * Detalles activos de un catálogo por su código.
 * Uso: useCatalogoPorCodigo('TIPO_DOCUMENTO') para poblar selects.
 */
export function useCatalogoPorCodigo(codigo: string | null | undefined) {
  return useQuery({
    queryKey: ['catalogos', 'codigo', codigo],
    queryFn: () => catalogosApi.obtenerPorCodigo(codigo!),
    enabled: !!codigo,
    staleTime: 10 * 60_000,
  });
}

export function useCrearCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogosApi.crear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Catálogo creado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: Parameters<typeof catalogosApi.actualizar>[1];
    }) => catalogosApi.actualizar(id, input),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      qc.invalidateQueries({ queryKey: ['catalogos', v.id] });
      toast.success('Catálogo actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACT' | 'INA' }) =>
      catalogosApi.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Estado actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCrearDetalle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogoId,
      input,
    }: {
      catalogoId: number;
      input: Parameters<typeof catalogosApi.crearDetalle>[1];
    }) => catalogosApi.crearDetalle(catalogoId, input),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      qc.invalidateQueries({ queryKey: ['catalogos', v.catalogoId] });
      toast.success('Detalle creado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useActualizarDetalle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      detalleId,
      input,
    }: {
      detalleId: number;
      input: Parameters<typeof catalogosApi.actualizarDetalle>[1];
    }) => catalogosApi.actualizarDetalle(detalleId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Detalle actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCambiarEstadoDetalle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ detalleId, estado }: { detalleId: number; estado: 'ACT' | 'INA' }) =>
      catalogosApi.cambiarEstadoDetalle(detalleId, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Estado del detalle actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
