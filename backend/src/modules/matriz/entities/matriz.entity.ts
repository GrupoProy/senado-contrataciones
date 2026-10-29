export interface MatrizRol {
  rol: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    estado: string;
  };
  permisos: Array<{
    id: number;
    clave: string;
    modulo: string;
    accion: string;
    descripcion: string | null;
    asignado: boolean;
  }>;
  menus: Array<{
    id: number;
    clave: string;
    etiqueta: string;
    ruta: string | null;
    icono: string | null;
    menu_padre_id: number | null;
    orden: number;
    asignado: boolean;
  }>;
  usuarios: Array<{
    id: number;
    username: string;
    nombres: string;
    primer_apellido: string;
    estado: string;
    fecha_desde: string;
    fecha_hasta: string | null;
  }>;
}

export interface MenuArbolMatriz {
  id: number;
  clave: string;
  etiqueta: string;
  ruta: string | null;
  icono: string | null;
  menu_padre_id: number | null;
  orden: number;
  hijos?: MenuArbolMatriz[];
}

export interface MatrizUsuario {
  rol: { rol_id: number; codigo: string; nombre: string } | null;
  permisos: Array<{ clave: string; modulo: string; accion: string }>;
  menus: MenuArbolMatriz[];
}