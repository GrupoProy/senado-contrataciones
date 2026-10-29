import { query } from '../../../config/database';
import { env } from '../../../config/env';

export interface ParametroRow {
  id: number;
  clave: string;
  valor: string;
  valor_por_defecto: string | null;
  tipo_dato: 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'JSON';
  grupo: string;
  descripcion: string | null;
  es_editable: boolean;
  es_publico: boolean;
  es_obligatorio: boolean;
  estado: string;
}

export class ParametroRepository {
  private schema = env.db.schema;

  async listarTodosActivos(): Promise<ParametroRow[]> {
    const result = await query<ParametroRow>(
      `SELECT id, clave, valor, valor_por_defecto, tipo_dato, grupo,
              descripcion, es_editable, es_publico, es_obligatorio, estado
         FROM ${this.schema}.parametro_sistema
        WHERE estado = 'ACT'`
    );
    return result.rows;
  }

  async listar(grupo?: string): Promise<ParametroRow[]> {
    const conditions: string[] = [`estado = 'ACT'`];
    const values: unknown[] = [];
    let idx = 1;

    if (grupo) {
      conditions.push(`grupo = $${idx++}`);
      values.push(grupo.toUpperCase());
    }

    const result = await query<ParametroRow>(
      `SELECT id, clave, valor, valor_por_defecto, tipo_dato, grupo,
              descripcion, es_editable, es_publico, es_obligatorio, estado
         FROM ${this.schema}.parametro_sistema
        WHERE ${conditions.join(' AND ')}
        ORDER BY grupo, clave`,
      values
    );
    return result.rows;
  }

  async obtenerPorClave(clave: string): Promise<ParametroRow | null> {
    const r = await query<ParametroRow>(
      `SELECT id, clave, valor, valor_por_defecto, tipo_dato, grupo,
              descripcion, es_editable, es_publico, es_obligatorio, estado
         FROM ${this.schema}.parametro_sistema WHERE clave = $1`,
      [clave]
    );
    return r.rows[0] ?? null;
  }

  async actualizar(clave: string, nuevoValor: string, usuarioModificacion: string): Promise<void> {
    await query(
      `UPDATE ${this.schema}.parametro_sistema
          SET valor = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE clave = $3`,
      [nuevoValor, usuarioModificacion, clave]
    );
  }
}