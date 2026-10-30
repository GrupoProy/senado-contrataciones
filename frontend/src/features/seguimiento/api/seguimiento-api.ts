import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type {
  HistorialResponse,
  BandejaSeguimientoItem,
  AccionSimpleInput,
  ObservarInput,
  SubsanarInput,
  FinalizarInput,
  RechazarInput,
  AccionResponse,
  RecibirMasivoInput,
  DerivarMasivoInput,
  RegistrarFirmaInput,
} from '../types/seguimiento-types';

export interface DerivarPosteriorInput {
  requerimientoId: number;
  motivo?: string | null;
  observaciones?: string | null;
}

export interface DerivarPosteriorResponse {
  tipo: 'INICIAL' | 'POSTERIOR';
  seguimientoId: number;
  codigoDerivacion: string;
  estadoDestino: string;
  unidadDestinoId: number;
}

export const seguimientoApi = {
  historial: (requerimientoId: number, page = 1, limit = 50) =>
    apiClient.get<HistorialResponse>(`/seguimiento/requerimiento/${requerimientoId}`, {
      page,
      limit,
    }),

  bandeja: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<BandejaSeguimientoItem>>('/seguimiento/bandeja', {
      page,
      limit,
    }),

  derivarPosterior: (input: DerivarPosteriorInput) =>
    apiClient.post<DerivarPosteriorResponse>('/seguimiento/derivar', input),

  // ✅ Derivación masiva posterior
  derivarMasivoPosterior: (input: DerivarMasivoInput) =>
    apiClient.post<any>('/seguimiento/derivar-masivo', input),

  recibir: (input: AccionSimpleInput) =>
    apiClient.post<AccionResponse>('/seguimiento/recibir', input),

  // ✅ Recepción masiva
  recibirMasivo: (input: RecibirMasivoInput) =>
    apiClient.post<any>('/seguimiento/recibir-masivo', input),

  iniciarRevision: (input: AccionSimpleInput) =>
    apiClient.post<AccionResponse>('/seguimiento/iniciar-revision', input),

  concluirRevision: (input: AccionSimpleInput) =>
    apiClient.post<AccionResponse>('/seguimiento/concluir-revision', input),

  elaborarContrato: (input: {
    requerimientoId: number;
    codigoCape: string;
    fechaDesde?: string;
    fechaHasta?: string;
    fechaFirma?: string | null;
    observaciones?: string | null;
  }) => apiClient.post<any>('/seguimiento/elaborar-contrato', input),

  enviarFirma: (input: AccionSimpleInput) =>
    apiClient.post<AccionResponse>('/seguimiento/enviar-firma', input),

  //registrarFirma: (input: AccionSimpleInput) =>
  //apiClient.post<AccionResponse>('/seguimiento/registrar-firma', input),

  registrarFirma: (input: RegistrarFirmaInput) =>
    apiClient.post<AccionResponse>('/seguimiento/registrar-firma', input),

  observar: (input: ObservarInput) =>
    apiClient.post<AccionResponse>('/seguimiento/observar', input),

  subsanar: (input: SubsanarInput) =>
    apiClient.post<AccionResponse>('/seguimiento/subsanar', input),

  aprobar: (input: AccionSimpleInput) =>
    apiClient.post<AccionResponse>('/seguimiento/aprobar', input),

  finalizar: (input: FinalizarInput) =>
    apiClient.post<AccionResponse>('/seguimiento/finalizar', input),

  rechazar: (input: RechazarInput) =>
    apiClient.post<AccionResponse>('/seguimiento/rechazar', input),

  noSubsanado: (input: RechazarInput) =>
    apiClient.post<AccionResponse>('/seguimiento/no-subsanado', input),

  obtenerEstadisticas: () => apiClient.get<Record<string, number>>('/seguimiento/stats'),

  obtenerChecklist: (requerimientoId: number) =>
    apiClient.get<
      Array<{ codigo: string; nombre: string; verificado: boolean; observaciones: string | null }>
    >(`/seguimiento/checklist/${requerimientoId}`),

  guardarChecklist: (
    requerimientoId: number,
    requisitos: Array<{ codigo: string; verificado: boolean; observaciones?: string | null }>
  ) =>
    apiClient.post<{ message: string }>(`/seguimiento/checklist/${requerimientoId}`, {
      requisitos,
    }),
};
