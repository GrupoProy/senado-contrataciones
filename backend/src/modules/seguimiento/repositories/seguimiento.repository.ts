import { PoolClient } from 'pg';
import { query } from '../../../config/database';
import { env } from '../../../config/env';
import { SeguimientoDetalleRow, DerivablesRow } from '../entities/seguimiento.entity';

export class SeguimientoRepository {
  private schema = env.db.schema;

  async listarPorRequerimiento(requerimientoId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.seguimiento_requerimiento WHERE requerimiento_id = $1`,
      [requerimientoId]
    );

    const data = await query<SeguimientoDetalleRow>(
            `SELECT s.id, 
              s.requerimiento_id AS "requerimientoId", 
              s.numero_seguimiento AS "numeroSeguimiento", 
              s.seguimiento_origen_id AS "seguimientoOrigenId", 
              s.flujo_id AS "flujoId",
              s.unidad_origen_id AS "unidadOrigenId", 
              s.usuario_envio AS "usuarioEnvio", 
              s.fecha_envio AS "fechaEnvio", 
              s.unidad_destino_id AS "unidadDestinoId", 
              s.usuario_recepcion AS "usuarioRecepcion", 
              s.fecha_recepcion AS "fechaRecepcion",
              s.estado_codigo AS "estadoCodigo", 
              s.accion_codigo AS "accionCodigo", 
              s.tipo_movimiento_codigo AS "tipoMovimientoCodigo", 
              s.resultado_codigo AS "resultadoCodigo", 
              s.codigo_derivacion AS "codigoDerivacion",
              s.unidad_responsable_observacion_id AS "unidadResponsableObservacionId", 
              s.fecha_observacion AS "fechaObservacion", 
              s.fecha_subsanacion AS "fechaSubsanacion",
              s.usuario_revision AS "usuarioRevision", 
              s.fecha_inicio_revision AS "fechaInicioRevision", 
              s.fecha_fin_revision AS "fechaFinRevision",
              s.usuario_finalizacion AS "usuarioFinalizacion", 
              s.fecha_finalizacion AS "fechaFinalizacion", 
              s.observaciones, 
              s.motivo, 
              s.usuario_creacion AS "usuarioCreacion", 
              s.fecha_creacion AS "fechaCreacion",
              uo.nombre AS "unidadOrigenNombre", uo.sigla AS "unidadOrigenSigla",
              ud.nombre AS "unidadDestinoNombre", ud.sigla AS "unidadDestinoSigla",
              r.codigo AS "requerimientoCodigo", r.titulo AS "requerimientoTitulo"
         FROM ${this.schema}.seguimiento_requerimiento s
         JOIN ${this.schema}.unidad_organizacional uo ON uo.id = s.unidad_origen_id
         LEFT JOIN ${this.schema}.unidad_organizacional ud ON ud.id = s.unidad_destino_id
         JOIN ${this.schema}.requerimiento r ON r.id = s.requerimiento_id
        WHERE s.requerimiento_id = $1
        ORDER BY s.numero_seguimiento DESC LIMIT $2 OFFSET $3`,
      [requerimientoId, limit, offset]
    );

    return { data: data.rows, total: parseInt(count.rows[0].total, 10), page, limit };
  }

  async obtenerPorId(id: number): Promise<SeguimientoDetalleRow | null> {
    const result = await query<SeguimientoDetalleRow>(
            `SELECT s.id, 
              s.requerimiento_id AS "requerimientoId", 
              s.numero_seguimiento AS "numeroSeguimiento", 
              s.seguimiento_origen_id AS "seguimientoOrigenId", 
              s.flujo_id AS "flujoId",
              s.unidad_origen_id AS "unidadOrigenId", 
              s.usuario_envio AS "usuarioEnvio", 
              s.fecha_envio AS "fechaEnvio", 
              s.unidad_destino_id AS "unidadDestinoId", 
              s.usuario_recepcion AS "usuarioRecepcion", 
              s.fecha_recepcion AS "fechaRecepcion",
              s.estado_codigo AS "estadoCodigo", 
              s.accion_codigo AS "accionCodigo", 
              s.tipo_movimiento_codigo AS "tipoMovimientoCodigo", 
              s.resultado_codigo AS "resultadoCodigo", 
              s.codigo_derivacion AS "codigoDerivacion",
              s.unidad_responsable_observacion_id AS "unidadResponsableObservacionId", 
              s.fecha_observacion AS "fechaObservacion", 
              s.fecha_subsanacion AS "fechaSubsanacion",
              s.usuario_revision AS "usuarioRevision", 
              s.fecha_inicio_revision AS "fechaInicioRevision", 
              s.fecha_fin_revision AS "fechaFinRevision",
              s.usuario_finalizacion AS "usuarioFinalizacion", 
              s.fecha_finalizacion AS "fechaFinalizacion", 
              s.observaciones, 
              s.motivo, 
              s.usuario_creacion AS "usuarioCreacion", 
              s.fecha_creacion AS "fechaCreacion",
              uo.nombre AS "unidadOrigenNombre", uo.sigla AS "unidadOrigenSigla",
              ud.nombre AS "unidadDestinoNombre", ud.sigla AS "unidadDestinoSigla",
              r.codigo AS "requerimientoCodigo", r.titulo AS "requerimientoTitulo"
         FROM ${this.schema}.seguimiento_requerimiento s
         JOIN ${this.schema}.unidad_organizacional uo ON uo.id = s.unidad_origen_id
         LEFT JOIN ${this.schema}.unidad_organizacional ud ON ud.id = s.unidad_destino_id
         JOIN ${this.schema}.requerimiento r ON r.id = s.requerimiento_id
        WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async listarBandeja(unidadId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.requerimiento
        WHERE unidad_actual_id = $1 AND estado_codigo NOT IN ('REGISTRADO','FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')`,
      [unidadId]
    );

    const data = await query<any>(
      `SELECT r.id AS requerimiento_id, r.codigo AS requerimiento_codigo, r.titulo AS requerimiento_titulo,
              r.nro_certificacion, r.estado_codigo, r.prioridad, ua.nombre AS unidad_actual_nombre,
              r.unidad_solicitante_id, us.nombre AS unidad_solicitante_nombre,
              s.id AS ultimo_seguimiento_id, s.codigo_derivacion AS ultimo_codigo_derivacion, s.fecha_envio AS ultima_fecha_envio,
              EXTRACT(DAY FROM (CURRENT_TIMESTAMP - COALESCE(s.fecha_envio, r.fecha_creacion)))::int AS dias_transcurridos, -- ✅ ALERTA
              p.nombres || ' ' || p.primer_apellido AS persona_nombres, p.numero_documento AS persona_documento,
              c.codigo AS cargo_codigo, c.nombre AS cargo_nombre, c.salario_mes AS cargo_salario_mes
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         LEFT JOIN ${this.schema}.cargo c ON c.id = r.cargo_id
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
         LEFT JOIN ${this.schema}.unidad_organizacional us ON us.id = r.unidad_solicitante_id
         LEFT JOIN ${this.schema}.seguimiento_requerimiento s ON s.id = r.seguimiento_actual_id
        WHERE r.unidad_actual_id = $1 AND r.estado_codigo NOT IN ('REGISTRADO','FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')
        ORDER BY r.prioridad DESC, r.fecha_creacion ASC LIMIT $2 OFFSET $3`,
      [unidadId, limit, offset]
    );

    return {
      data: data.rows.map((row) => ({
        requerimientoId: row.requerimiento_id,
        requerimientoCodigo: row.requerimiento_codigo,
        requerimientoTitulo: row.requerimiento_titulo,
        nroCertificacion: row.nro_certificacion,
        estadoCodigo: row.estado_codigo,
        prioridad: row.prioridad,
        unidadActualNombre: row.unidad_actual_nombre,
        unidadSolicitanteId: row.unidad_solicitante_id,
        unidadSolicitanteNombre: row.unidad_solicitante_nombre,
        ultimoSeguimientoId: row.ultimo_seguimiento_id,
        ultimoCodigoDerivacion: row.ultimo_codigo_derivacion,
        ultimaFechaEnvio: row.ultima_fecha_envio,
        diasTranscurridos: row.dias_transcurridos, // ✅ NUEVO
        personaNombres: row.persona_nombres,
        personaDocumento: row.persona_documento,
        cargoCodigo: row.cargo_codigo,
        cargoNombre: row.cargo_nombre,
        cargoSalarioMes: row.cargo_salario_mes,
      })),
      total: parseInt(count.rows[0].total, 10),
      page,
      limit,
    };
  }

  async listarDerivables(unidadId: number): Promise<DerivablesRow[]> {
    const result = await query<{
      id: number; codigo: string | null; nro_certificacion: string; titulo: string;
      estado_codigo: string; prioridad: string; fecha_creacion: Date; persona_nombres: string; persona_documento: string;
    }>(
      `SELECT r.id, r.codigo, r.nro_certificacion, r.titulo, r.estado_codigo, r.prioridad, r.fecha_creacion,
              p.nombres || ' ' || p.primer_apellido AS persona_nombres, p.numero_documento AS persona_documento
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
        WHERE r.unidad_actual_id = $1 AND r.estado_codigo NOT IN ('REGISTRADO','FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')
        ORDER BY r.prioridad DESC, r.fecha_creacion ASC`,
      [unidadId]
    );

    return result.rows.map((row) => ({
      id: row.id, codigo: row.codigo, nroCertificacion: row.nro_certificacion, titulo: row.titulo,
      estadoCodigo: row.estado_codigo, prioridad: row.prioridad, fechaCreacion: row.fecha_creacion,
      personaNombres: row.persona_nombres, personaDocumento: row.persona_documento,
    }));
  }

  async siguienteNumero(client: PoolClient, requerimientoId: number): Promise<number> {
    const r = await client.query<{ siguiente: number }>(
      `SELECT COALESCE(MAX(numero_seguimiento), 0) + 1 AS siguiente
         FROM ${this.schema}.seguimiento_requerimiento WHERE requerimiento_id = $1`, [requerimientoId]
    );
    return r.rows[0].siguiente;
  }

  async crear(
    client: PoolClient,
    data: {
      requerimientoId: number; numeroSeguimiento: number; seguimientoOrigenId: number | null;
      flujoId: number; unidadOrigenId: number; usuarioEnvio: string; unidadDestinoId: number | null;
      estadoCodigo: string; accionCodigo: string; tipoMovimientoCodigo: string; resultadoCodigo: string | null;
      codigoDerivacion: string | null; unidadResponsableObservacionId: number | null;
      fechaObservacion: Date | null; fechaSubsanacion: Date | null; usuarioRecepcion: string | null;
      fechaRecepcion: Date | null; usuarioRevision: string | null; fechaInicioRevision: Date | null;
      fechaFinRevision: Date | null; usuarioFinalizacion: string | null; fechaFinalizacion: Date | null;
      observaciones: string | null; motivo: string | null;
    },
    usuarioCreacion: string
  ): Promise<number> {
    const r = await client.query<{ id: number }>(
      `INSERT INTO ${this.schema}.seguimiento_requerimiento
         (requerimiento_id, numero_seguimiento, seguimiento_origen_id, flujo_id, unidad_origen_id, usuario_envio,
          unidad_destino_id, estado_codigo, accion_codigo, tipo_movimiento_codigo, resultado_codigo, codigo_derivacion,
          unidad_responsable_observacion_id, fecha_observacion, fecha_subsanacion, usuario_recepcion, fecha_recepcion,
          usuario_revision, fecha_inicio_revision, fecha_fin_revision, usuario_finalizacion, fecha_finalizacion,
          observaciones, motivo, usuario_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING id`,
      [
        data.requerimientoId, data.numeroSeguimiento, data.seguimientoOrigenId, data.flujoId, data.unidadOrigenId, data.usuarioEnvio,
        data.unidadDestinoId, data.estadoCodigo, data.accionCodigo, data.tipoMovimientoCodigo, data.resultadoCodigo, data.codigoDerivacion,
        data.unidadResponsableObservacionId, data.fechaObservacion, data.fechaSubsanacion, data.usuarioRecepcion, data.fechaRecepcion,
        data.usuarioRevision, data.fechaInicioRevision, data.fechaFinRevision, data.usuarioFinalizacion, data.fechaFinalizacion,
        data.observaciones, data.motivo, usuarioCreacion,
      ]
    );
    return r.rows[0].id;
  }

  async obtenerEstadisticas(unidadId: number) {
    const r = await query<{ estado_codigo: string; total: string }>(
      `SELECT estado_codigo, COUNT(*)::text AS total
         FROM ${this.schema}.requerimiento
        WHERE unidad_actual_id = $1
          AND estado_codigo NOT IN ('REGISTRADO','FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')
        GROUP BY estado_codigo`,
      [unidadId]
    );
    const stats: Record<string, number> = {};
    r.rows.forEach((row) => { stats[row.estado_codigo] = parseInt(row.total, 10); });
    return stats;
  }
}