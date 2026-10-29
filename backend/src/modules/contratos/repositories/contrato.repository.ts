import { PoolClient } from 'pg';
import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';

export interface ContratoRow {
  id: number;
  requerimientoId: number;
  personaId: number;
  numero: string;
  fechaDesde: Date;
  fechaHasta: Date;
  salarioMes: number | null;
  estadoCodigo: string;
  fechaFirma: Date | null;
  observaciones: string | null;
  fechaCreacion: Date;
  personaNombres: string;
  personaDocumento: string;
  requerimientoCodigo: string | null;
}

export class ContratoRepository {
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // LISTADO
  // ═══════════════════════════════════════════════════════════════════════

  async listar(params: {
    page: number;
    limit: number;
    search?: string;
    personaId?: number;
    estadoCodigo?: string;
  }) {
    const { page, limit, search, personaId, estadoCodigo } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(
        `(c.numero ILIKE $${idx} OR p.numero_documento ILIKE $${idx} OR p.nombres ILIKE $${idx} OR p.primer_apellido ILIKE $${idx})`
      );
      values.push(`%${search}%`);
      idx++;
    }
    if (personaId) {
      conditions.push(`c.persona_id = $${idx++}`);
      values.push(personaId);
    }
    if (estadoCodigo) {
      conditions.push(`c.estado_codigo = $${idx++}`);
      values.push(estadoCodigo);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
         FROM ${this.schema}.contrato c
         JOIN ${this.schema}.persona p ON p.id = c.persona_id
         ${where}`,
      values
    );

    values.push(limit, offset);
    const data = await query<ContratoRow>(
      `SELECT c.id,
              c.requerimiento_id               AS "requerimientoId",
              c.persona_id                     AS "personaId",
              c.numero,
              c.fecha_desde                    AS "fechaDesde",
              c.fecha_hasta                    AS "fechaHasta",
              c.salario_mes                    AS "salarioMes",
              c.estado_codigo                  AS "estadoCodigo",
              c.fecha_firma                    AS "fechaFirma",
              c.observaciones,
              c.fecha_creacion                 AS "fechaCreacion",
              p.nombres || ' ' || p.primer_apellido AS "personaNombres",
              p.numero_documento               AS "personaDocumento",
              r.codigo                         AS "requerimientoCodigo"
         FROM ${this.schema}.contrato c
         JOIN ${this.schema}.persona p ON p.id = c.persona_id
         LEFT JOIN ${this.schema}.requerimiento r ON r.id = c.requerimiento_id
         ${where}
        ORDER BY c.fecha_creacion DESC
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

  // ═══════════════════════════════════════════════════════════════════════
  // DETALLE
  // ═══════════════════════════════════════════════════════════════════════

  async obtenerPorId(id: number): Promise<ContratoRow | null> {
    const result = await query<ContratoRow>(
      `SELECT c.id,
              c.requerimiento_id               AS "requerimientoId",
              c.persona_id                     AS "personaId",
              c.numero,
              c.fecha_desde                    AS "fechaDesde",
              c.fecha_hasta                    AS "fechaHasta",
              c.salario_mes                    AS "salarioMes",
              c.estado_codigo                  AS "estadoCodigo",
              c.fecha_firma                    AS "fechaFirma",
              c.observaciones,
              c.fecha_creacion                 AS "fechaCreacion",
              p.nombres || ' ' || p.primer_apellido AS "personaNombres",
              p.numero_documento               AS "personaDocumento",
              r.codigo                         AS "requerimientoCodigo"
         FROM ${this.schema}.contrato c
         JOIN ${this.schema}.persona p ON p.id = c.persona_id
         LEFT JOIN ${this.schema}.requerimiento r ON r.id = c.requerimiento_id
        WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS AUXILIARES
  // ═══════════════════════════════════════════════════════════════════════

  async tieneContratoEnCurso(personaId: number): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.contrato
        WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO'`,
      [personaId]
    );
    return parseInt(result.rows[0].count, 10) > 0;
  }

  async existeContratoParaRequerimiento(requerimientoId: number): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.contrato
        WHERE requerimiento_id = $1`,
      [requerimientoId]
    );
    return parseInt(result.rows[0].count, 10) > 0;
  }

  async existeNumero(numero: string): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.contrato
        WHERE numero = $1`,
      [numero]
    );
    return parseInt(result.rows[0].count, 10) > 0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ESCRITURA
  // ═══════════════════════════════════════════════════════════════════════

  async crear(
    data: {
      requerimientoId: number;
      personaId: number;
      numero: string;
      fechaDesde: string;
      fechaHasta: string;
      salarioMes: number | null;
      fechaFirma: string | null;
      observaciones: string | null;
    },
    usuarioCreacion: string
  ) {
    return transaction(async (client: PoolClient) => {
      // Verificar contrato en curso (dentro de la transacción)
      const existe = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.contrato
          WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO'`,
        [data.personaId]
      );
      if (parseInt(existe.rows[0].count, 10) > 0) {
        throw new Error('La persona ya tiene un contrato EN_CURSO');
      }

      const result = await client.query<{ id: number }>(
        `INSERT INTO ${this.schema}.contrato
           (requerimiento_id, persona_id, numero, fecha_desde, fecha_hasta,
            salario_mes, fecha_firma, observaciones, usuario_creacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          data.requerimientoId,
          data.personaId,
          data.numero,
          data.fechaDesde,
          data.fechaHasta,
          data.salarioMes,
          data.fechaFirma,
          data.observaciones,
          usuarioCreacion,
        ]
      );
      return result.rows[0].id;
    });
  }

  async actualizar(
    id: number,
    data: {
      salarioMes?: number | null;
      fechaFirma?: string | null;
      observaciones?: string | null;
    },
    usuarioModificacion: string
  ) {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.salarioMes !== undefined) {
      sets.push(`salario_mes = $${idx++}`);
      values.push(data.salarioMes);
    }
    if (data.fechaFirma !== undefined) {
      sets.push(`fecha_firma = $${idx++}`);
      values.push(data.fechaFirma);
    }
    if (data.observaciones !== undefined) {
      sets.push(`observaciones = $${idx++}`);
      values.push(data.observaciones);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.contrato SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(
    id: number,
    estadoCodigo: string,
    usuarioModificacion: string
  ) {
    await query(
      `UPDATE ${this.schema}.contrato
          SET estado_codigo = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estadoCodigo, usuarioModificacion, id]
    );
  }

  /**
   * Devuelve los requerimientos que están APROBADOS o FINALIZADOS
   * y que aún no tienen contrato. Sirve para poblar el combo de creación.
   */
  async listarRequerimientosDisponiblesParaContrato(): Promise<
    Array<{
      id: number;
      codigo: string | null;
      titulo: string;
      personaId: number;
      personaNombres: string;
      personaDocumento: string;
      salarioSugerido: number | null;
    }>
  > {
    const result = await query<{
      id: number;
      codigo: string | null;
      titulo: string;
      persona_id: number;
      persona_nombres: string;
      persona_documento: string;
      salario_sugerido: number | null;
    }>(
      `SELECT r.id,
              r.codigo,
              r.titulo,
              r.persona_id,
              p.nombres || ' ' || p.primer_apellido AS persona_nombres,
              p.numero_documento AS persona_documento,
              c.salario_mes AS salario_sugerido
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         LEFT JOIN ${this.schema}.cargo c ON c.id = r.cargo_id
         LEFT JOIN ${this.schema}.contrato con ON con.requerimiento_id = r.id
        WHERE r.estado_codigo IN ('APROBADO','FINALIZADO')
          AND con.id IS NULL
        ORDER BY r.fecha_creacion DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      codigo: row.codigo,
      titulo: row.titulo,
      personaId: row.persona_id,
      personaNombres: row.persona_nombres,
      personaDocumento: row.persona_documento,
      salarioSugerido: row.salario_sugerido,
    }));
  }
}