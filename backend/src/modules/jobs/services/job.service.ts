import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';
import { parametroService } from '../../parametros/services/parametro.service';

export class JobService {
  private schema = env.db.schema;

  /**
   * Job de vencimiento y activación de contratos.
   * 1. Cambia de EN_CURSO a CONCLUIDO los contratos vencidos.
   * 2. Cambia de PENDIENTE a EN_CURSO los contratos que inician hoy (si la persona no tiene otro en curso).
   * Registra la ejecución en job_ejecucion.
   */
  async ejecutarVencimientoContratos(): Promise<{
    procesados: number;
    actualizados: number;
    cerrados: number;
    abiertos: number;
  }> {
    if (!parametroService.getBool('JOB_CONTRATOS_HABILITADO', true)) {
      return { procesados: 0, actualizados: 0, cerrados: 0, abiertos: 0 };
    }

    // Registrar inicio del Job
    const inicio = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.job_ejecucion
         (proceso, fecha_inicio, usuario_creacion)
       VALUES ('VENCIMIENTO_CONTRATOS', CURRENT_TIMESTAMP, 'job')
       RETURNING id`
    );
    const jobId = inicio.rows[0].id;

    try {
      const resultado = await transaction(async (client) => {
        const hoyBolivia = `(CURRENT_TIMESTAMP AT TIME ZONE 'America/La_Paz')::date`;

        // 1. CERRAR CONTRATOS VENCIDOS
        const cerradosRes = await client.query<{ id: number }>(
          `UPDATE ${this.schema}.contrato
              SET estado_codigo = 'CONCLUIDO',
                  usuario_ultima_modificacion = 'JOB_CONTRATOS',
                  fecha_ultima_modificacion = CURRENT_TIMESTAMP
            WHERE estado_codigo = 'EN_CURSO'
              AND fecha_hasta < ${hoyBolivia}
            RETURNING id`
        );

        // 2. APERTURAR CONTRATOS PENDIENTES
        // Usamos DISTINCT ON para activar solo 1 contrato pendiente por persona
        const abiertosRes = await client.query<{ id: number }>(
          `WITH pendientes AS (
             SELECT DISTINCT ON (persona_id) id
             FROM ${this.schema}.contrato
             WHERE estado_codigo = 'PENDIENTE'
               AND fecha_desde <= ${hoyBolivia}
               -- Validamos que la persona NO tenga otro contrato EN_CURSO
               AND persona_id NOT IN (
                   SELECT persona_id FROM ${this.schema}.contrato WHERE estado_codigo = 'EN_CURSO'
               )
             ORDER BY persona_id, fecha_desde ASC, id ASC
           )
           UPDATE ${this.schema}.contrato c
           SET estado_codigo = 'EN_CURSO',
               usuario_ultima_modificacion = 'JOB_CONTRATOS',
               fecha_ultima_modificacion = CURRENT_TIMESTAMP
           FROM pendientes p
           WHERE c.id = p.id
           RETURNING c.id`
        );

        return {
          cerrados: cerradosRes.rowCount || 0,
          abiertos: abiertosRes.rowCount || 0,
        };
      });

      const totalProcesados = resultado.cerrados + resultado.abiertos;

      // Registrar éxito en el log del Job
      await query(
        `UPDATE ${this.schema}.job_ejecucion
            SET fecha_fin = CURRENT_TIMESTAMP,
                resultado = 'OK',
                cantidad_procesada = $1
          WHERE id = $2`,
        [totalProcesados, jobId]
      );

      return { 
        procesados: totalProcesados, 
        actualizados: totalProcesados,
        cerrados: resultado.cerrados,
        abiertos: resultado.abiertos 
      };

    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      await query(
        `UPDATE ${this.schema}.job_ejecucion
            SET fecha_fin = CURRENT_TIMESTAMP,
                resultado = 'ERROR',
                error_mensaje = $1
          WHERE id = $2`,
        [mensaje, jobId]
      );
      throw error;
    }
  }

  async listarEjecuciones(proceso?: string) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (proceso) {
      conditions.push(`proceso = $${idx++}`);
      values.push(proceso.toUpperCase());
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT id, proceso, fecha_inicio, fecha_fin, resultado,
              cantidad_procesada, error_mensaje
         FROM ${this.schema}.job_ejecucion
         ${where}
        ORDER BY fecha_inicio DESC
        LIMIT 100`,
      values
    );
    return result.rows;
  }
}

export const jobService = new JobService();