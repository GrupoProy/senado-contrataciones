export interface Seguimiento {
  id: number;
  requerimientoId: number;
  numeroSeguimiento: number;
  seguimientoOrigenId: number | null;
  flujoId: number;
  unidadOrigenId: number;
  usuarioEnvio: string | null;
  fechaEnvio: string;
  unidadDestinoId: number | null;
  usuarioRecepcion: string | null;
  fechaRecepcion: string | null;
  estadoCodigo: string;
  accionCodigo: string;
  tipoMovimientoCodigo: string;
  resultadoCodigo: string | null;
  codigoDerivacion: string | null;
  unidadResponsableObservacionId: number | null;
  fechaObservacion: string | null;
  fechaSubsanacion: string | null;
  usuarioRevision: string | null;
  fechaInicioRevision: string | null;
  fechaFinRevision: string | null;
  usuarioFinalizacion: string | null;
  fechaFinalizacion: string | null;
  observaciones: string | null;
  motivo: string | null;
  usuarioCreacion: string;
  fechaCreacion: string;
  unidadOrigenNombre: string | null;
  unidadOrigenSigla: string | null;
  unidadDestinoNombre: string | null;
  unidadDestinoSigla: string | null;
  requerimientoCodigo: string | null;
  requerimientoTitulo: string | null;
}

export interface HistorialResponse {
  data: Seguimiento[];
  total: number;
  page: number;
  limit: number;
}

export interface BandejaSeguimientoItem {
  requerimientoId: number;
  requerimientoCodigo: string | null;
  requerimientoTitulo: string;
  nroCertificacion: string;
  estadoCodigo: string;
  prioridad: string;
  unidadActualNombre: string | null;
  unidadSolicitanteId: number | null;
  unidadSolicitanteNombre: string | null;
  ultimoSeguimientoId: number | null;
  ultimoCodigoDerivacion: string | null;
  ultimaFechaEnvio: string | null;
  diasTranscurridos: number;
  personaNombres: string;
  personaDocumento: string;
  cargoCodigo: string | null;
  cargoNombre: string | null;
  cargoSalarioMes: number | null;
}

export interface AccionSimpleInput {
  requerimientoId: number;
  observaciones?: string | null;
}

export interface RegistrarFirmaInput {
  requerimientoId: number;
  fechaFirma: string;
  observaciones?: string | null;
}

export interface ObservarInput {
  requerimientoId: number;
  observaciones: string;
  unidadResponsableObservacionId?: number;
}

export interface SubsanarInput {
  requerimientoId: number;
  observaciones: string;
}

export interface FinalizarInput {
  requerimientoId: number;
  resultadoFinalCodigo?: string | null;
  tipoFinalizacionCodigo?: string | null;
  observaciones?: string | null;
}

export interface RechazarInput {
  requerimientoId: number;
  observaciones: string;
  motivo: string;
}

export interface AccionResponse {
  seguimientoId: number;
  estadoDestino: string;
  unidadDestinoId: number | null;
}

export type TipoAccion =
  | 'RECIBIR'
  | 'INICIAR_REVISION'
  | 'CONCLUIR_REVISION'
  | 'ELABORAR_CONTRATO'
  | 'ENVIAR_FIRMA'
  | 'REGISTRAR_FIRMA'
  | 'OBSERVAR'
  | 'SUBSANAR'
  | 'APROBAR_CONTRATO'
  | 'FINALIZAR'
  | 'RECHAZAR'
  | 'NO_SUBSANADO';

// ✅ Nuevas interfaces para acciones masivas
export interface RecibirMasivoInput {
  requerimientoIds: number[];
  observaciones?: string | null;
}

export interface DerivarMasivoInput {
  requerimientoIds: number[];
  motivo?: string | null;
  observaciones?: string | null;
}
