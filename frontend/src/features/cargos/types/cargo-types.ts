export interface Cargo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  nivel: string;
  clase: string;
  salario_mes: number;
  unidad_organizacional_id: number | null;
  estado: string;
  unidad_nombre?: string | null;
}

export interface CargosQuery {
  page?: number;
  limit?: number;
  search?: string;
  unidadId?: number;
  soloActivos?: boolean;
}
