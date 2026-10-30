import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  seguimientoApi,
  type DerivarPosteriorInput,
  type DerivarPosteriorResponse,
} from '../api/seguimiento-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  AccionSimpleInput,
  ObservarInput,
  SubsanarInput,
  FinalizarInput,
  RechazarInput,
  AccionResponse,
  RecibirMasivoInput,
  DerivarMasivoInput,
  RegistrarFirmaInput, // ✅ Importado correctamente
} from '../types/seguimiento-types';

// ... (Queries: useHistorial, useBandejaSeguimiento, etc. sin cambios)

export function useHistorial(requerimientoId: number | null) {
  return useQuery({
    queryKey: ['seguimiento', 'historial', requerimientoId],
    queryFn: () => seguimientoApi.historial(requerimientoId!),
    enabled: !!requerimientoId && !isNaN(Number(requerimientoId)) && Number(requerimientoId) > 0,
    staleTime: 15_000,
  });
}

export function useBandejaSeguimiento(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['seguimiento', 'bandeja', page, limit],
    queryFn: () => seguimientoApi.bandeja(page, limit),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useSeguimientoStats() {
  return useQuery({
    queryKey: ['seguimiento', 'stats'],
    queryFn: async () => {
      const res: any = await seguimientoApi.obtenerEstadisticas();
      return res?.data || res;
    },
    staleTime: 30_000,
  });
}

export function useChecklist(requerimientoId: number | null) {
  return useQuery({
    queryKey: ['seguimiento', 'checklist', requerimientoId],
    queryFn: () => seguimientoApi.obtenerChecklist(requerimientoId!),
    enabled: !!requerimientoId,
  });
}

export function useGuardarChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requisitos }: { id: number; requisitos: any[] }) =>
      seguimientoApi.guardarChecklist(id, requisitos),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['seguimiento', 'checklist', v.id] });
      toast.success('Requisitos verificados guardados');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ─── Helper de invalidación ───
function useInvalidarSeguimiento() {
  const qc = useQueryClient();
  return (requerimientoId?: number) => {
    qc.invalidateQueries({ queryKey: ['seguimiento'] });
    qc.invalidateQueries({ queryKey: ['requerimientos'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    if (requerimientoId) {
      qc.invalidateQueries({ queryKey: ['seguimiento', 'historial', requerimientoId] });
      qc.invalidateQueries({ queryKey: ['requerimientos', requerimientoId] });
    }
  };
}

// ─── Mutaciones Masivas ───
export function useRecibirMasivo() {
  const invalidar = useInvalidarSeguimiento();
  return useMutation({
    mutationFn: (input: RecibirMasivoInput) => seguimientoApi.recibirMasivo(input),
    onSuccess: (res: any) => {
      invalidar();
      const total = res?.data?.resultados?.filter((r: any) => r.success).length || 0;
      toast.success('Recepción masiva completada', {
        description: `${total} requerimientos recibidos correctamente.`,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDerivarMasivoPosterior() {
  const invalidar = useInvalidarSeguimiento();
  return useMutation({
    mutationFn: (input: DerivarMasivoInput) => seguimientoApi.derivarMasivoPosterior(input),
    onSuccess: (res: any) => {
      invalidar();
      const data = res?.data || res;
      toast.success(`Derivación masiva exitosa`, {
        description: `Lote: ${data.codigoRequerimientoLote} (${data.totalRequerimientos} reqs)`,
        duration: 8000,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ─── Mutaciones Simples ───
function useAccionMutation<TInput extends { requerimientoId: number }>(
  fn: (input: TInput) => Promise<AccionResponse>,
  label: string
) {
  const invalidar = useInvalidarSeguimiento();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res, input) => {
      invalidar(input.requerimientoId);
      toast.success(`${label} exitosamente`, {
        description: `Nuevo estado: ${res.estadoDestino}`,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDerivarPosterior() {
  const invalidar = useInvalidarSeguimiento();
  return useMutation({
    mutationFn: (input: DerivarPosteriorInput) => seguimientoApi.derivarPosterior(input),
    onSuccess: (res: DerivarPosteriorResponse, input) => {
      invalidar(input.requerimientoId);
      toast.success(`Derivado con código ${res.codigoDerivacion}`, {
        description: `Nuevo estado: ${res.estadoDestino}`,
        duration: 8000,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRecibir() {
  return useAccionMutation<AccionSimpleInput>(
    (input) => seguimientoApi.recibir(input),
    'Recepción registrada'
  );
}

export function useIniciarRevision() {
  return useAccionMutation<AccionSimpleInput>(
    (input) => seguimientoApi.iniciarRevision(input),
    'Revisión iniciada'
  );
}

export function useConcluirRevision() {
  return useAccionMutation<AccionSimpleInput>(
    (input) => seguimientoApi.concluirRevision(input),
    'Revisión concluida'
  );
}

export function useElaborarContrato() {
  const invalidar = useInvalidarSeguimiento();
  return useMutation({
    mutationFn: (input: {
      requerimientoId: number;
      codigoCape: string;
      fechaDesde?: string;
      fechaHasta?: string;
      fechaFirma?: string | null;
      observaciones?: string | null;
    }) => seguimientoApi.elaborarContrato(input),
    onSuccess: (res, input) => {
      invalidar(input.requerimientoId);
      toast.success(`Contrato ${res.numeroContrato} registrado`, {
        description: `Estado destino: ${res.estadoDestino}`,
        duration: 8000,
      });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useEnviarFirma() {
  return useAccionMutation<AccionSimpleInput>(
    (input) => seguimientoApi.enviarFirma(input),
    'Enviado a firma'
  );
}

// ✅ CORRECCIÓN AQUÍ: Usamos RegistrarFirmaInput en lugar de AccionSimpleInput
export function useRegistrarFirma() {
  return useAccionMutation<RegistrarFirmaInput>(
    (input) => seguimientoApi.registrarFirma(input),
    'Firma registrada'
  );
}

export function useObservar() {
  return useAccionMutation<ObservarInput>(
    (input) => seguimientoApi.observar(input),
    'Observación registrada'
  );
}

export function useSubsanar() {
  return useAccionMutation<SubsanarInput>(
    (input) => seguimientoApi.subsanar(input),
    'Subsanación registrada'
  );
}

export function useAprobar() {
  return useAccionMutation<AccionSimpleInput>(
    (input) => seguimientoApi.aprobar(input),
    'Contrato aprobado'
  );
}

export function useFinalizar() {
  return useAccionMutation<FinalizarInput>(
    (input) => seguimientoApi.finalizar(input),
    'Requerimiento finalizado'
  );
}

export function useRechazar() {
  return useAccionMutation<RechazarInput>(
    (input) => seguimientoApi.rechazar(input),
    'Requerimiento rechazado'
  );
}

export function useNoSubsanado() {
  return useAccionMutation<RechazarInput>(
    (input) => seguimientoApi.noSubsanado(input),
    'Cierre por no subsanación'
  );
}
