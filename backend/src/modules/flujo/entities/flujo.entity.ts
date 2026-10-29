export interface FlujoEntity {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  version: number;
  estado: string;
  fechaCreacion: Date;
}

export interface FlujoTransicionEntity {
  id: number;
  flujoId: number;
  unidadOrigenId: number;
  estadoOrigenCodigo: string | null;
  accionCodigo: string;
  unidadDestinoId: number | null;
  estadoDestinoCodigo: string;
  tipoMovimientoCodigo: string;
  resultadoCodigo: string | null;
  requiereObservacion: boolean;
  requiereMotivo: boolean;
  permiteFinalizacion: boolean;
  estado: string;
  fechaCreacion: Date;
  // Enriquecidos
  unidadOrigenNombre?: string;
  unidadOrigenSigla?: string | null;
  unidadDestinoNombre?: string | null;
  unidadDestinoSigla?: string | null;
}

/**
 * Acción disponible en el contexto actual del requerimiento.
 * Es la vista que consume el frontend para habilitar/deshabilitar botones.
 */
export interface AccionDisponible {
  accionCodigo: string;
  accionNombre: string;
  unidadDestinoId: number | null;
  unidadDestinoNombre: string | null;
  estadoDestinoCodigo: string;
  estadoDestinoNombre: string;
  tipoMovimientoCodigo: string;
  resultadoCodigo: string | null;
  resultadoNombre: string | null;
  requiereObservacion: boolean;
  requiereMotivo: boolean;
  permiteFinalizacion: boolean;
}

/**
 * Resultado de validar una transición puntual.
 */
export interface ValidacionTransicion {
  valida: boolean;
  transicionId?: number;
  motivo?: string;
  // Reglas que debe cumplir el request
  requiereObservacion?: boolean;
  requiereMotivo?: boolean;
  permiteFinalizacion?: boolean;
  unidadDestinoId?: number | null;
  estadoDestinoCodigo?: string;
  tipoMovimientoCodigo?: string;
  resultadoCodigo?: string | null;
}