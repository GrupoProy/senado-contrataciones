export interface Permiso {
  id: number;
  clave: string;
  modulo: string;
  accion: string;
  descripcion: string | null;
  estado: 'ACT' | 'INA';
}
