//import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requerimientoApi } from '../api/requerimiento-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  CrearRequerimientoInput,
  RequerimientosQuery,
  DerivarInput,
  DerivarMasivoInput,
} from '../types/requerimiento-types';

// ═══════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Lista paginada de requerimientos con filtros (search, estado, prioridad).
 * Mantiene los datos previos mientras carga para evitar parpadeo.
 */
export function useRequerimientos(query: RequerimientosQuery) {
  return useQuery({
    queryKey: ['requerimientos', query],
    queryFn: () => requerimientoApi.listar(query),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Detalle de un requerimiento por id.
 */
/*export function useRequerimiento(id: number | null) {
  return useQuery({
    queryKey: ['requerimientos', id],
    queryFn: () => requerimientoApi.obtener(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}*/

export function useRequerimiento(id: number | null | undefined) {
  return useQuery({
    queryKey: ['requerimientos', id],
    queryFn: () => requerimientoApi.obtener(id!),
    // Solo ejecuta la petición si el ID es un número válido
    enabled: !!id && !isNaN(Number(id)) && Number(id) > 0,
  });
}

/**
 * Bandeja de derivación: requerimientos en estado REGISTRADO
 * pendientes de la primera derivación (Of. Mayor → DRH).
 */
export function useBandejaDerivar() {
  return useQuery({
    queryKey: ['requerimientos', 'bandeja-derivar'],
    queryFn: () => requerimientoApi.bandejaDerivar(),
    staleTime: 10_000,
  });
}

/**
 * Bandeja general del usuario: requerimientos activos en su unidad.
 */
export function useBandeja(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['requerimientos', 'bandeja', page, limit],
    queryFn: () => requerimientoApi.bandeja(page, limit),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Búsqueda de persona por documento (para el label inteligente).
 * Solo se ejecuta si tipoDocumento y numeroDocumento son válidos.
 */
export function useBuscarPersona(
  tipoDocumento: string,
  numeroDocumento: string,
  complemento?: string | null
) {
  const habilitado = tipoDocumento.length >= 2 && numeroDocumento.length >= 3;

  return useQuery({
    queryKey: ['requerimientos', 'buscar-persona', tipoDocumento, numeroDocumento, complemento],
    queryFn: () =>
      requerimientoApi.buscarPersona(tipoDocumento, numeroDocumento, complemento ?? null),
    enabled: habilitado,
    staleTime: 30_000,
  });
}

/**
 * Verifica si una persona tiene un proceso activo (requerimiento o contrato).
 * Se usa para bloquear la creación de un nuevo requerimiento.
 */
export function useProcesoActivoPersona(personaId: number | null) {
  return useQuery({
    queryKey: ['requerimientos', 'proceso-activo', personaId],
    queryFn: () => requerimientoApi.procesoActivoPersona(personaId!),
    enabled: !!personaId,
    staleTime: 15_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Crear un nuevo requerimiento.
 * Invalida las listas, la bandeja-derivar y el dashboard.
 */
export function useCrearRequerimiento() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearRequerimientoInput) => requerimientoApi.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requerimientos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Requerimiento registrado', {
        description: 'El código REQ- se generará en la primera derivación.',
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

/**
 * Actualizar un requerimiento (solo si está en estado editable).
 */
export function useActualizarRequerimiento() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CrearRequerimientoInput> }) =>
      requerimientoApi.actualizar(id, input),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['requerimientos'] });
      qc.invalidateQueries({ queryKey: ['requerimientos', v.id] });
      toast.success('Requerimiento actualizado');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

/**
 * Derivación individual (bandeja de requerimiento).
 * Genera REQ- (si no existe) y DER- (siempre uno nuevo).
 */
export function useDerivar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DerivarInput }) =>
      requerimientoApi.derivar(id, input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['requerimientos'] });
      qc.invalidateQueries({ queryKey: ['seguimiento'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Derivado con código ${res.codigoDerivacion}`, {
        description: `REQ: ${res.codigoRequerimiento}`,
        duration: 8000,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

/**
 * Derivación masiva (bandeja de requerimiento).
 * Genera un solo REQ- y un solo DER- compartidos por todo el lote.
 */
export function useDerivarMasivo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: DerivarMasivoInput) => requerimientoApi.derivarMasivo(input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['requerimientos'] });
      qc.invalidateQueries({ queryKey: ['seguimiento'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Derivación masiva: ${res.totalRequerimientos} requerimiento(s)`, {
        description: `REQ: ${res.codigoRequerimientoLote} · DER: ${res.codigoDerivacion}`,
        duration: 12000,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRequerimientoStats() {
  return useQuery({
    queryKey: ['requerimientos', 'stats'],
    queryFn: async () => {
      const res: any = await requerimientoApi.obtenerEstadisticas();
      // ✅ Si tu apiClient devuelve { success: true, data: {...} }, esto extrae el data.
      // Si ya devuelve el objeto directo, simplemente lo retorna.
      return res?.data || res;
    },
    staleTime: 30_000,
  });
}
