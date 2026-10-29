export interface RolEntity {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fechaCreacion: Date;
}