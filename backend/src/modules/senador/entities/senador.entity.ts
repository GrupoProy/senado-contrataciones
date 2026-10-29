export interface SenadorEntity {
  id: number;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  siglaPolitica: string | null;
  periodoInicio: Date | null;
  periodoFin: Date | null;
  email: string | null;
  telefono: string | null;
  estado: 'ACT' | 'INA';
  usuarioCreacion: number;
  fechaCreacion: Date;
  usuarioUltimaModificacion: number | null;
  fechaUltimaModificacion: Date | null;
}

export interface SenadorListadoRow {
  id: number;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  siglaPolitica: string | null;
  periodoInicio: Date | null;
  periodoFin: Date | null;
  email: string | null;
  telefono: string | null;
  estado: 'ACT' | 'INA';
  fechaCreacion: Date;
}