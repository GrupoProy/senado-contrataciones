export interface CatalogoEntity {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fechaCreacion: Date;
}

export interface CatalogoDetalleEntity {
  id: number;
  catalogoId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  valor: string | null;
  orden: number;
  estado: string;
  fechaCreacion: Date;
}

export interface CatalogoConDetalles extends CatalogoEntity {
  detalles: CatalogoDetalleEntity[];
}