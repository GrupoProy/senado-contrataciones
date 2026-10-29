/**
 * Entidad de dominio de un Contrato.
 * Solo interfaces: la persistencia va en repositories, la lógica en services.
 */

export interface ContratoEntity {
  id: number;
  requerimientoId: number;
  personaId: number;
  numero: string;
  fechaDesde: Date;
  fechaHasta: Date;
  salarioMes: number | null;
  estadoCodigo: 'EN_CURSO' | 'CONCLUIDO' | 'ANULADO';
  fechaFirma: Date | null;
  observaciones: string | null;
  usuarioCreacion: string;
  fechaCreacion: Date;
  usuarioUltimaModificacion: string | null;
  fechaUltimaModificacion: Date | null;
}

/**
 * Vista enriquecida del contrato con datos de persona y requerimiento.
 * Es la forma que devuelve el repositorio al frontend.
 */
export interface ContratoDetalle extends ContratoEntity {
  personaNombres: string;
  personaDocumento: string;
  requerimientoCodigo: string | null;
}

/**
 * Resumen de contrato para listados paginados.
 */
export interface ContratoListado {
  id: number;
  requerimientoId: number;
  personaId: number;
  numero: string;
  fechaDesde: Date;
  fechaHasta: Date;
  salarioMes: number | null;
  estadoCodigo: string;
  fechaFirma: Date | null;
  personaNombres: string;
  personaDocumento: string;
  requerimientoCodigo: string | null;
}