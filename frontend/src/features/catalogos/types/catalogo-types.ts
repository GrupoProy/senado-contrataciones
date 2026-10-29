export interface Catalogo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fecha_creacion: string;
  total_detalles?: number;
}

export interface CatalogoDetalle {
  id: number;
  catalogo_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  valor: string | null;
  orden: number;
  estado: string;
}

export interface CatalogoConDetalles extends Catalogo {
  detalles: CatalogoDetalle[];
}

/** Detalle liviano que devuelve GET /catalogos/codigo/:codigo */
export interface CatalogoDetalleItem {
  codigo: string;
  nombre: string;
  valor: string | null;
  orden: number;
}

export interface CatalogosQuery {
  page?: number;
  limit?: number;
  search?: string;
  soloActivos?: boolean;
}
