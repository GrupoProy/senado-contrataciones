import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class MenuRepository {
  private schema = env.db.schema;

  async listar() {
    const result = await query(
      `SELECT m.id, m.clave, m.etiqueta, m.ruta, m.icono, m.menu_padre_id,
              m.orden, m.estado, p.etiqueta AS padre_etiqueta
         FROM ${this.schema}.menu m
         LEFT JOIN ${this.schema}.menu p ON p.id = m.menu_padre_id
        ORDER BY COALESCE(m.menu_padre_id, m.id), m.orden`
    );
    return result.rows;
  }

  async obtenerPorId(id: number) {
    const r = await query(
      `SELECT id, clave, etiqueta, ruta, icono, menu_padre_id, orden, estado
         FROM ${this.schema}.menu WHERE id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  async crear(
    data: {
      clave: string;
      etiqueta: string;
      ruta: string | null;
      icono: string | null;
      menuPadreId: number | null;
      orden: number;
    },
    usuarioCreacion: string
  ) {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.menu
         (clave, etiqueta, ruta, icono, menu_padre_id, orden, usuario_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        data.clave,
        data.etiqueta,
        data.ruta,
        data.icono,
        data.menuPadreId,
        data.orden,
        usuarioCreacion,
      ]
    );
    return result.rows[0].id;
  }

  async actualizar(
    id: number,
    data: {
      etiqueta?: string;
      ruta?: string | null;
      icono?: string | null;
      menuPadreId?: number | null;
      orden?: number;
    },
    usuarioModificacion: string
  ) {
    const mapa: Record<string, string> = {
      etiqueta: 'etiqueta',
      ruta: 'ruta',
      icono: 'icono',
      menuPadreId: 'menu_padre_id',
      orden: 'orden',
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(mapa)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push((data as Record<string, unknown>)[key]);
      }
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.menu SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(id: number, estado: string, usuarioModificacion: string) {
    await query(
      `UPDATE ${this.schema}.menu
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }
}