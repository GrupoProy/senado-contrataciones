export type EstadoContrato = 'EN_CURSO' | 'CONCLUIDO' | 'ANULADO' | 'PENDIENTE';

export interface Contrato {
  id: number;
  requerimientoId: number;
  personaId: number;
  numero: string;
  fechaDesde: string;
  fechaHasta: string;
  salarioMes: number | null;
  estadoCodigo: EstadoContrato;
  fechaFirma: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  personaNombres: string;
  personaDocumento: string;
  requerimientoCodigo: string | null;
}

export interface ContratosQuery {
  page?: number;
  limit?: number;
  search?: string;
  personaId?: number;
  estadoCodigo?: EstadoContrato;
}

export interface CrearContratoInput {
  requerimientoId: number;
  personaId: number;
  numero: string;
  fechaDesde: string;
  fechaHasta: string;
  salarioMes?: number | null;
  fechaFirma?: string | null;
  observaciones?: string | null;
}

export interface ActualizarContratoInput {
  salarioMes?: number | null;
  fechaFirma?: string | null;
  observaciones?: string | null;
}

export interface RequerimientoDisponible {
  id: number;
  codigo: string | null;
  titulo: string;
  personaId: number;
  personaNombres: string;
  personaDocumento: string;
  salarioSugerido: number | null;
}
