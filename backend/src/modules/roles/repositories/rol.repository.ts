import { query } from '../../../config/database';
import { env } from '../../../config/env';

export interface RolRow {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
}

export class RolRepository {
  private schema = env.db.schema;

  async listar() {
    const result = await query(
      `SELECT r.id, r.codigo, r.nombre, r.descripcion, r.estado,
              (SELECT COUNT(*)::int FROM ${this.schema}.rol_permiso rp
                WHERE rp.rol_id = r.id AND rp.estado = 'ACT') AS total_permisos,
              (SELECT COUNT(*)::int FROM ${this.schema}.menu_rol mr
                WHERE mr.rol_id = r.id AND mr.estado = 'ACT') AS total_menus,
              (SELECT COUNT(*)::int FROM ${this.schema}.usuario_rol ur
                WHERE ur.rol_id = r.id AND ur.estado = 'ACT'
                  AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)) AS total_usuarios
         FROM ${this.schema}.rol r
        ORDER BY r.nombre`
    );
    return result.rows;
  }

  async obtenerPorId(id: number): Promise<RolRow | null> {
    const result = await query<RolRow>(
      `SELECT id, codigo, nombre, descripcion, estado
         FROM ${this.schema}.rol WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async crear(
    data: { codigo: string; nombre: string; descripcion: string | null },
    usuarioCreacion: string
  ) {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.rol (codigo, nombre, descripcion, usuario_creacion)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.codigo, data.nombre, data.descripcion, usuarioCreacion]
    );
    return result.rows[0].id;
  }

  async actualizar(
    id: number,
    data: { nombre?: string; descripcion?: string | null },
    usuarioModificacion: string
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.rol SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(id: number, estado: string, usuarioModificacion: string): Promise<void> {
    await query(
      `UPDATE ${this.schema}.rol
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }
}