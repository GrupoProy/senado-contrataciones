export interface PermisoEntity {
  id: number;
  clave: string;
  modulo: string;
  accion: string;
  descripcion: string | null;
  estado: string;
  fechaCreacion: Date;
}