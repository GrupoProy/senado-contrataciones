export interface Parametro {
  id: number;
  clave: string;
  valor: string;
  valor_por_defecto: string | null; // ✅ Agregado
  tipo_dato: 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'JSON';
  grupo: string;
  descripcion: string | null;
  es_editable: boolean;
  es_publico: boolean;
  es_obligatorio: boolean;
  estado: string;
}
