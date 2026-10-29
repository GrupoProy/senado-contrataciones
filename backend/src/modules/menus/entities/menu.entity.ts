export interface MenuEntity {
  id: number;
  clave: string;
  etiqueta: string;
  ruta: string | null;
  icono: string | null;
  menuPadreId: number | null;
  orden: number;
  estado: string;
}

export interface MenuArbol extends MenuEntity {
  hijos: MenuArbol[];
}