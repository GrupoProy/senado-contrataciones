export interface Unidad {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  descripcion: string | null;
  unidad_padre_id: number | null;
  padre_nombre: string | null;
  estado: 'ACT' | 'INA';
}

export interface CrearUnidadInput {
  codigo: string;
  nombre: string;
  sigla?: string | null;
  descripcion?: string | null;
  unidadPadreId?: number | null;
}
