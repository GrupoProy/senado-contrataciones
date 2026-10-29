export interface UnidadEntity {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  descripcion: string | null;
  unidadPadreId: number | null;
  estado: string;
  fechaCreacion: Date;
}

export interface UnidadArbol extends UnidadEntity {
  hijos: UnidadArbol[];
}