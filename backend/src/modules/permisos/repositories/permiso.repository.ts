import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class PermisoRepository {
  private schema = env.db.schema;

  async listar(filtros: { modulo?: string; search?: string } = {}) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filtros.modulo) {
      conditions.push(`modulo = $${idx++}`);
      values.push(filtros.modulo.toUpperCase());
    }
    if (filtros.search) {
      conditions.push(`(clave ILIKE $${idx} OR descripcion ILIKE $${idx})`);
      values.push(`%${filtros.search}%`);
      idx++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT id, clave, modulo, accion, descripcion, estado
         FROM ${this.schema}.permiso
         ${where}
        ORDER BY modulo, accion`,
      values
    );
    return result.rows;
  }

  async agrupadosPorModulo() {
    const result = await query<{ modulo: string; total: string }>(
      `SELECT modulo, COUNT(*)::text AS total
         FROM ${this.schema}.permiso
        WHERE estado = 'ACT'
        GROUP BY modulo
        ORDER BY modulo`
    );
    return result.rows;
  }

  async obtenerPorId(id: number) {
    const r = await query(
      `SELECT id, clave, modulo, accion, descripcion, estado
         FROM ${this.schema}.permiso WHERE id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  async crear(
    data: { clave: string; modulo: string; accion: string; descripcion: string | null },
    usuarioCreacion: string
  ) {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.permiso (clave, modulo, accion, descripcion, usuario_creacion)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.clave, data.modulo, data.accion, data.descripcion, usuarioCreacion]
    );
    return result.rows[0].id;
  }

  async cambiarEstado(id: number, estado: string, usuarioModificacion: string) {
    await query(
      `UPDATE ${this.schema}.permiso
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }
}