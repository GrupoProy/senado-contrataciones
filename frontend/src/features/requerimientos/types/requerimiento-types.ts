export interface Requerimiento {
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
  tipoContratoNombre?: string | null;
  tipoRequerimientoNombre?: string | null;
  fechaSolicitud: string;
  fechaInicioPrevista: string | null;
  fechaFinPrevista: string | null;
  resultadoFinalCodigo: string | null;
  tipoFinalizacionCodigo: string | null;
  fechaFinalizacion: string | null;
  usuarioFinalizacion: string | null;
  observacionFinal: string | null;
  seguimientoActualId: number | null;
  usuarioCreacion: string;
  fechaCreacion: string;

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
  diasTranscurridos: number;
}

export interface PersonaRef {
  tipoDocumento: string;
  numeroDocumento: string;
  complemento?: string | null;
  nombres?: string;
  primerApellido?: string;
  segundoApellido?: string | null;
  fechaNacimiento?: string;
  email?: string | null;
  telefono?: string | null;
}

export interface CrearRequerimientoInput {
  nroCertificacion: string;
  titulo: string;
  descripcion?: string | null;
  persona: PersonaRef;
  cargoId: number;
  senadorId?: number | null;
  unidadSolicitanteId: number;
  prioridad: string;
  tipoContrato?: string | null;
  tipoRequerimiento?: string | null;
  fechaInicioPrevista?: string | null;
  fechaFinPrevista?: string | null;
}

export interface RequerimientosQuery {
  page?: number;
  limit?: number;
  search?: string;
  estadoCodigo?: string;
  prioridad?: string;
  unidadSolicitanteId?: number;
  unidadActualId?: number;
  senadorId?: number;
}

export interface PersonaEncontrada {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  complemento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  estadoCivil: string | null;
  nacionalidad: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  edad: number | null;
}

export interface BuscarPersonaResponse {
  existe: boolean;
  persona: PersonaEncontrada | null;
}

export interface ProcesoActivo {
  personaId: number;
  tieneProcesoActivo: boolean;
  puedeRegistrarNuevo: boolean;
  motivoBloqueo: string | null;
  requerimiento: {
    id: number;
    codigo: string | null;
    nroCertificacion: string;
    titulo: string;
    estadoCodigo: string;
    unidadActualNombre: string | null;
    fechaCreacion: string;
  } | null;
  contrato: {
    id: number;
    numero: string;
    estadoCodigo: string;
    fechaDesde: string;
    fechaHasta: string;
  } | null;
}

export interface DerivarInput {
  motivo?: string | null;
  observaciones?: string | null;
}

export interface DerivarMasivoInput {
  requerimientoIds: number[];
  motivo?: string | null;
  observaciones?: string | null;
}

export interface DerivarResponse {
  tipo: 'INICIAL' | 'POSTERIOR';
  seguimientoId: number;
  codigoDerivacion: string;
  codigoRequerimiento: string;
  estadoDestino: string;
  unidadDestinoId: number;
}

export interface DerivarMasivoResponse {
  tipo: 'INICIAL' | 'POSTERIOR';
  operacion: string;
  codigoRequerimientoLote: string;
  codigoDerivacion: string;
  codigoUnico: boolean;
  totalRequerimientos: number;
  requerimientos: Array<{
    requerimientoId: number;
    seguimientoId: number;
    codigoRequerimiento: string;
  }>;
  mensaje: string;
}
