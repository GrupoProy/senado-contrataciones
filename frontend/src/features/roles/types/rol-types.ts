export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  total_permisos?: number;
  total_menus?: number;
  total_usuarios?: number;
}

export interface CrearRolInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}
