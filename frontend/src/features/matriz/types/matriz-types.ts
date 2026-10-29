export interface PermisoItem {
  id: number;
  clave: string;
  modulo: string;
  accion: string;
  descripcion: string | null;
  asignado: boolean;
}

export interface MenuItem {
  id: number;
  clave: string;
  etiqueta: string;
  ruta: string | null;
  asignado: boolean;
}

export interface MatrizRol {
  rol: { id: number; codigo: string; nombre: string };
  permisos: PermisoItem[];
  menus: MenuItem[];
}
