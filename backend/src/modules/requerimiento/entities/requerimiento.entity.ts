export interface RequerimientoEntity {
  id: number;
  codigo: string | null;
  codigoGrupo: string | null;
  nroCertificacion: string;
  titulo: string;
  descripcion: string | null;
  personaId: number;
  cargoId: number | null;
  senadorId: number | null;
  unidadSolicitanteId: number;
  unidadActualId: number | null;
  estadoCodigo: string;
  prioridad: string;
  tipoContrato: string | null;
  tipoRequerimiento: string | null;
  fechaSolicitud: Date;
  fechaInicioPrevista: Date | null;
  fechaFinPrevista: Date | null;
  resultadoFinalCodigo: string | null;
  tipoFinalizacionCodigo: string | null;
  fechaFinalizacion: Date | null;
  usuarioFinalizacion: string | null;
  observacionFinal: string | null;
  seguimientoActualId: number | null;
  usuarioCreacion: string;
  fechaCreacion: Date;
}

export interface RequerimientoDetalleRow extends RequerimientoEntity {
  personaNombres: string | null;
  personaDocumento: string | null;
  cargoCodigo: string | null;
  cargoNombre: string | null;
  cargoSalarioMes: number | null;
  senadorNombres: string | null;
  senadorDocumento: string | null;
  senadorSiglaPolitica: string | null;
  unidadSolicitanteNombre: string | null;
  unidadActualNombre: string | null;
  tipoContratoNombre: string | null;
  tipoRequerimientoNombre: string | null;
}

export interface RequerimientoListadoRow {
  id: number;
  codigo: string | null;
  nroCertificacion: string;
  titulo: string;
  estadoCodigo: string;
  prioridad: string;
  tipoContratoNombre: string | null;
  tipoRequerimientoNombre: string | null;
  fechaSolicitud: Date;
  fechaCreacion: Date;
  personaNombres: string;
  personaDocumento: string;
  cargoCodigo: string | null;
  cargoNombre: string | null;
  cargoSalarioMes: number | null;
  senadorId: number | null;
  senadorNombres: string | null;
  senadorSiglaPolitica: string | null;
  unidadSolicitanteNombre: string | null;
  unidadActualNombre: string | null;
  diasTranscurridos: number;
}