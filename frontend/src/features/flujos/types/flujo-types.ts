export interface Flujo {
  id: number;
  codigo: string;
  nombre: string;
  version: number;
  estado: string;
}

export interface Transicion {
  id: number;
  unidad_origen_nombre: string;
  estado_origen_codigo: string | null;
  accion_codigo: string;
  unidad_destino_nombre: string | null;
  estado_destino_codigo: string;
  permite_finalizacion: boolean;
}
