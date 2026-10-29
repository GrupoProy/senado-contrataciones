import { query } from '../../../config/database';
import { env } from '../../../config/env';
import type { SenadorListadoRow } from '../entities/senador.entity';

export class SenadorRepository {
  private schema = env.db.schema;

  async listar(params: {
    page: number;
    limit: number;
    search?: string;
    estado?: string;
    siglaPolitica?: string;
    soloActivos: boolean;
  }) {
    const { page, limit, search, estado, siglaPolitica, soloActivos } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (soloActivos) conditions.push(`estado = 'ACT'`);
    else if (estado) { conditions.push(`estado = $${idx++}`); values.push(estado); }

    if (siglaPolitica) { conditions.push(`sigla_politica ILIKE $${idx++}`); values.push(`%${siglaPolitica}%`); }

    if (search) {
      conditions.push(`(nombres ILIKE $${idx} OR primer_apellido ILIKE $${idx} OR segundo_apellido ILIKE $${idx} OR numero_documento ILIKE $${idx} OR sigla_politica ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.senador ${where}`, values
    );

    values.push(limit, offset);
    const data = await query<SenadorListadoRow>(
      `SELECT id, tipo_documento AS "tipoDocumento", numero_documento AS "numeroDocumento",
              nombres, primer_apellido AS "primerApellido", segundo_apellido AS "segundoApellido",
              sigla_politica AS "siglaPolitica", periodo_inicio AS "periodoInicio", periodo_fin AS "periodoFin",
              email, telefono, estado, fecha_creacion AS "fechaCreacion"
         FROM ${this.schema}.senador
         ${where}
        ORDER BY primer_apellido, segundo_apellido NULLS LAST, nombres
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return { data: data.rows, total: parseInt(count.rows[0].total, 10), page, limit };
  }

  async obtenerPorId(id: number): Promise<SenadorListadoRow | null> {
    const result = await query<SenadorListadoRow>(
      `SELECT id, tipo_documento AS "tipoDocumento", numero_documento AS "numeroDocumento",
              nombres, primer_apellido AS "primerApellido", segundo_apellido AS "segundoApellido",
              sigla_politica AS "siglaPolitica", periodo_inicio AS "periodoInicio", periodo_fin AS "periodoFin",
              email, telefono, estado, fecha_creacion AS "fechaCreacion"
         FROM ${this.schema}.senador WHERE id = $1`, [id]
    );
    return result.rows[0] ?? null;
  }

  async crear(data: any, usuarioId: number): Promise<number> {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.senador
         (tipo_documento, numero_documento, nombres, primer_apellido, segundo_apellido,
          sigla_politica, periodo_inicio, periodo_fin, email, telefono, estado, usuario_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ACT',$11)
       RETURNING id`,
      [data.tipoDocumento, data.numeroDocumento, data.nombres, data.primerApellido, data.segundoApellido,
       data.siglaPolitica, data.periodoInicio, data.periodoFin, data.email, data.telefono, usuarioId]
    );
    return result.rows[0].id;
  }

  async actualizar(id: number, data: any, usuarioId: number): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const map: Record<string, string> = {
      tipoDocumento: 'tipo_documento', numeroDocumento: 'numero_documento',
      nombres: 'nombres', primerApellido: 'primer_apellido', segundoApellido: 'segundo_apellido',
      siglaPolitica: 'sigla_politica', periodoInicio: 'periodo_inicio', periodoFin: 'periodo_fin',
      email: 'email', telefono: 'telefono'
    };

    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) { sets.push(`${col} = $${idx++}`); values.push(data[key]); }
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`, `fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(usuarioId, id);

    await query(`UPDATE ${this.schema}.senador SET ${sets.join(', ')} WHERE id = $${idx}`, values);
  }

  async cambiarEstado(id: number, estado: string, usuarioId: number): Promise<void> {
    await query(
      `UPDATE ${this.schema}.senador
          SET estado = $1, usuario_ultima_modificacion = $2, fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioId, id]
    );
  }

  async eliminar(id: number): Promise<void> {
    await query(`DELETE FROM ${this.schema}.senador WHERE id = $1`, [id]);
  }
}