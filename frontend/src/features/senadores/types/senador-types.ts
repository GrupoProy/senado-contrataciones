export interface Senador {
  id: number;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  siglaPolitica: string | null;
  periodoInicio: string | null;
  periodoFin: string | null;
  email: string | null;
  telefono: string | null;
  estado: 'ACT' | 'INA';
  fechaCreacion: string;
}

export interface CrearSenadorInput {
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido?: string | null;
  siglaPolitica?: string | null;
  periodoInicio?: string | null;
  periodoFin?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export interface SenadoresQuery {
  page?: number;
  limit?: number;
  search?: string;
  estado?: 'ACT' | 'INA';
  siglaPolitica?: string;
  soloActivos?: boolean;
}
