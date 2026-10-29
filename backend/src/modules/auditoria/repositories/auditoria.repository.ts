import { query } from '../../../config/database';
import { env } from '../../../config/env';
import type { AuditoriaRow } from '../entities/auditoria.entity';

export class AuditoriaRepository {
  private schema = env.db.schema;

  async listar(params: {
    page: number;
    limit: number;
    tabla?: string;
    operacion?: string;
    usuario?: string;
  }) {
    const { page, limit, tabla, operacion, usuario } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (tabla) {
      conditions.push(`tabla_nombre ILIKE $${idx++}`);
      values.push(`%${tabla}%`);
    }
    if (operacion) {
      conditions.push(`operacion = $${idx++}`);
      values.push(operacion);
    }
    if (usuario) {
      conditions.push(`cambiado_por ILIKE $${idx++}`);
      values.push(`%${usuario}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
         FROM ${this.schema}.auditoria_generica
         ${where}`,
      values
    );

    values.push(limit, offset);
    const data = await query<AuditoriaRow>(
      `SELECT audit_id              AS "auditId",
              tabla_nombre          AS "tablaNombre",
              operacion,
              registro_id           AS "registroId",
              datos_anteriores      AS "datosAnteriores",
              datos_nuevos          AS "datosNuevos",
              diferencia,
              cambiado_por          AS "cambiadoPor",
              cambiado_en           AS "cambiadoEn",
              ip_origen::text       AS "ipOrigen",
              user_agent            AS "userAgent"
         FROM ${this.schema}.auditoria_generica
         ${where}
        ORDER BY cambiado_en DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return {
      data: data.rows,
      total: parseInt(count.rows[0].total, 10),
      page,
      limit,
    };
  }
}