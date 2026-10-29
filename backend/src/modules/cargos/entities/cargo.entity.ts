export interface CargoEntity {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  nivel: string;
  clase: string;
  salarioMes: number;
  unidadOrganizacionalId: number | null;
  estado: string;
  unidadNombre?: string | null;
  fechaCreacion: Date;
}