export interface SeguimientoEntity {
  id: number;
  requerimientoId: number;
  numeroSeguimiento: number;
  seguimientoOrigenId: number | null;
  flujoId: number;
  unidadOrigenId: number;
  usuarioEnvio: string;
  fechaEnvio: Date;
  unidadDestinoId: number | null;
  usuarioRecepcion: string | null;
  fechaRecepcion: Date | null;
  estadoCodigo: string;
  accionCodigo: string;
  tipoMovimientoCodigo: string;
  resultadoCodigo: string | null;
  codigoDerivacion: string | null;
  unidadResponsableObservacionId: number | null;
  fechaObservacion: Date | null;
  fechaSubsanacion: Date | null;
  usuarioRevision: string | null;
  fechaInicioRevision: Date | null;
  fechaFinRevision: Date | null;
  usuarioFinalizacion: string | null;
  fechaFinalizacion: Date | null;
  observaciones: string | null;
  motivo: string | null;
  usuarioCreacion: string;
  fechaCreacion: Date;
}

export interface SeguimientoDetalleRow extends SeguimientoEntity {
  unidadOrigenNombre: string;
  unidadOrigenSigla: string | null;
  unidadDestinoNombre: string | null;
  unidadDestinoSigla: string | null;
  requerimientoCodigo: string | null;
  requerimientoTitulo: string;
}

export interface BandejaSeguimientoRow {
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
  ultimaFechaEnvio: Date | null;
  personaNombres: string;
  personaDocumento: string;
  cargoCodigo: string | null;
  cargoNombre: string | null;
  cargoSalarioMes: number | null;
  diasTranscurridos: number;
}

export interface DerivablesRow {
  id: number;
  codigo: string | null;
  nroCertificacion: string;
  titulo: string;
  estadoCodigo: string;
  prioridad: string;
  fechaCreacion: Date;
  personaNombres: string;
  personaDocumento: string;
}