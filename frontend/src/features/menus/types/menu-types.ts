export interface Menu {
  id: number;
  clave: string;
  etiqueta: string;
  ruta: string | null;
  icono: string | null;
  menu_padre_id: number | null;
  orden: number;
  estado: 'ACT' | 'INA';
}

export interface MenuArbol extends Menu {
  hijos: MenuArbol[];
}
