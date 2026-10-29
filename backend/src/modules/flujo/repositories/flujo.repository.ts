import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';

export interface FlujoRow {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  version: number;
  estado: string;
  fecha_creacion: Date;
}

export interface TransicionRow {
  id: number;
  flujo_id: number;
  unidad_origen_id: number;
  estado_origen_codigo: string | null;
  accion_codigo: string;
  unidad_destino_id: number | null;
  estado_destino_codigo: string;
  tipo_movimiento_codigo: string;
  resultado_codigo: string | null;
  requiere_observacion: boolean;
  requiere_motivo: boolean;
  permite_finalizacion: boolean;
  estado: string;
  fecha_creacion: Date;
  unidad_origen_nombre: string;
  unidad_origen_sigla: string | null;
  unidad_destino_nombre: string | null;
  unidad_destino_sigla: string | null;
}

export interface AccionDisponibleRow {
  accion_codigo: string;
  accion_nombre: string;
  unidad_destino_id: number | null;
  unidad_destino_nombre: string | null;
  estado_destino_codigo: string;
  estado_destino_nombre: string;
  tipo_movimiento_codigo: string;
  resultado_codigo: string | null;
  resultado_nombre: string | null;
  requiere_observacion: boolean;
  requiere_motivo: boolean;
  permite_finalizacion: boolean;
}

export interface TransicionValidadaRow {
  id: number;
  unidad_destino_id: number | null;
  estado_destino_codigo: string;
  tipo_movimiento_codigo: string;
  resultado_codigo: string | null;
  requiere_observacion: boolean;
  requiere_motivo: boolean;
  permite_finalizacion: boolean;
}

export class FlujoRepository {
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // FLUJOS
  // ═══════════════════════════════════════════════════════════════════════

  async listarFlujos(params: { search?: string; soloActivos: boolean }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (params.soloActivos) conditions.push(`estado = 'ACT'`);
    if (params.search) {
      conditions.push(`(codigo ILIKE $${idx} OR nombre ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query<FlujoRow>(
      `SELECT id, codigo, nombre, descripcion, version, estado, fecha_creacion
         FROM ${this.schema}.flujo
         ${where}
        ORDER BY codigo`,
      values
    );
    return result.rows;
  }

  async obtenerFlujoPorId(id: number): Promise<FlujoRow | null> {
    const r = await query<FlujoRow>(
      `SELECT id, codigo, nombre, descripcion, version, estado, fecha_creacion
         FROM ${this.schema}.flujo WHERE id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  async obtenerFlujoPorCodigo(codigo: string): Promise<FlujoRow | null> {
    const r = await query<FlujoRow>(
      `SELECT id, codigo, nombre, descripcion, version, estado, fecha_creacion
         FROM ${this.schema}.flujo WHERE codigo = $1`,
      [codigo]
    );
    return r.rows[0] ?? null;
  }

  async crearFlujo(
    data: {
      codigo: string;
      nombre: string;
      descripcion: string | null;
      version: number;
    },
    usuarioCreacion: string
  ): Promise<number> {
    const r = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.flujo
         (codigo, nombre, descripcion, version, estado, usuario_creacion)
       VALUES ($1, $2, $3, $4, 'ACT', $5)
       RETURNING id`,
      [data.codigo, data.nombre, data.descripcion, data.version, usuarioCreacion]
    );
    return r.rows[0].id;
  }

  async actualizarFlujo(
    id: number,
    data: { nombre?: string; descripcion?: string | null; version?: number },
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
    if (data.version !== undefined) {
      sets.push(`version = $${idx++}`);
      values.push(data.version);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.flujo SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstadoFlujo(
    id: number,
    estado: string,
    usuarioModificacion: string
  ): Promise<void> {
    await query(
      `UPDATE ${this.schema}.flujo
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSICIONES
  // ═══════════════════════════════════════════════════════════════════════

  async listarTransiciones(
    flujoId: number,
    params: {
      unidadOrigenId?: number;
      estadoOrigenCodigo?: string;
      accionCodigo?: string;
      soloActivos: boolean;
    }
  ): Promise<TransicionRow[]> {
    const conditions: string[] = [`ft.flujo_id = $1`];
    const values: unknown[] = [flujoId];
    let idx = 2;

    if (params.soloActivos) conditions.push(`ft.estado = 'ACT'`);
    if (params.unidadOrigenId) {
      conditions.push(`ft.unidad_origen_id = $${idx++}`);
      values.push(params.unidadOrigenId);
    }
    if (params.estadoOrigenCodigo) {
      conditions.push(
        `COALESCE(ft.estado_origen_codigo, '__INICIAL__') = $${idx++}`
      );
      values.push(params.estadoOrigenCodigo.toUpperCase());
    }
    if (params.accionCodigo) {
      conditions.push(`ft.accion_codigo = $${idx++}`);
      values.push(params.accionCodigo.toUpperCase());
    }

    const result = await query<TransicionRow>(
      `SELECT ft.id, ft.flujo_id, ft.unidad_origen_id, ft.estado_origen_codigo,
              ft.accion_codigo, ft.unidad_destino_id, ft.estado_destino_codigo,
              ft.tipo_movimiento_codigo, ft.resultado_codigo,
              ft.requiere_observacion, ft.requiere_motivo, ft.permite_finalizacion,
              ft.estado, ft.fecha_creacion,
              uo.nombre AS unidad_origen_nombre,
              uo.sigla  AS unidad_origen_sigla,
              ud.nombre AS unidad_destino_nombre,
              ud.sigla  AS unidad_destino_sigla
         FROM ${this.schema}.flujo_transicion ft
         JOIN ${this.schema}.unidad_organizacional uo ON uo.id = ft.unidad_origen_id
         LEFT JOIN ${this.schema}.unidad_organizacional ud ON ud.id = ft.unidad_destino_id
         WHERE ${conditions.join(' AND ')}
        ORDER BY ft.unidad_origen_id, ft.estado_origen_codigo NULLS FIRST, ft.accion_codigo`,
      values
    );
    return result.rows;
  }

  async obtenerTransicionPorId(id: number): Promise<TransicionRow | null> {
    const r = await query<TransicionRow>(
      `SELECT ft.id, ft.flujo_id, ft.unidad_origen_id, ft.estado_origen_codigo,
              ft.accion_codigo, ft.unidad_destino_id, ft.estado_destino_codigo,
              ft.tipo_movimiento_codigo, ft.resultado_codigo,
              ft.requiere_observacion, ft.requiere_motivo, ft.permite_finalizacion,
              ft.estado, ft.fecha_creacion,
              uo.nombre AS unidad_origen_nombre,
              uo.sigla  AS unidad_origen_sigla,
              ud.nombre AS unidad_destino_nombre,
              ud.sigla  AS unidad_destino_sigla
         FROM ${this.schema}.flujo_transicion ft
         JOIN ${this.schema}.unidad_organizacional uo ON uo.id = ft.unidad_origen_id
         LEFT JOIN ${this.schema}.unidad_organizacional ud ON ud.id = ft.unidad_destino_id
        WHERE ft.id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }

  /**
   * Verifica si ya existe una transición ACTIVA con la misma clave
   * (flujo, unidad_origen, estado_origen, accion). Es la regla del índice único parcial.
   */
  async existeTransicionActiva(
    flujoId: number,
    unidadOrigenId: number,
    estadoOrigenCodigo: string | null,
    accionCodigo: string,
    excluirId?: number
  ): Promise<boolean> {
    const conditions: string[] = [
      `flujo_id = $1`,
      `unidad_origen_id = $2`,
      `accion_codigo = $3`,
      `estado = 'ACT'`,
      `COALESCE(estado_origen_codigo, '__INICIAL__') = $4`,
    ];
    const values: unknown[] = [
      flujoId,
      unidadOrigenId,
      accionCodigo,
      estadoOrigenCodigo ?? '__INICIAL__',
    ];
    let idx = 5;

    if (excluirId) {
      conditions.push(`id <> $${idx++}`);
      values.push(excluirId);
    }

    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.flujo_transicion
        WHERE ${conditions.join(' AND ')}`,
      values
    );
    return parseInt(r.rows[0].count, 10) > 0;
  }

  async crearTransicion(
    flujoId: number,
    data: {
      unidadOrigenId: number;
      estadoOrigenCodigo: string | null;
      accionCodigo: string;
      unidadDestinoId: number | null;
      estadoDestinoCodigo: string;
      tipoMovimientoCodigo: string;
      resultadoCodigo: string | null;
      requiereObservacion: boolean;
      requiereMotivo: boolean;
      permiteFinalizacion: boolean;
    },
    usuarioCreacion: string
  ): Promise<number> {
    return transaction(async (client) => {
      const r = await client.query<{ id: number }>(
        `INSERT INTO ${this.schema}.flujo_transicion
           (flujo_id, unidad_origen_id, estado_origen_codigo, accion_codigo,
            unidad_destino_id, estado_destino_codigo, tipo_movimiento_codigo,
            resultado_codigo, requiere_observacion, requiere_motivo,
            permite_finalizacion, estado, usuario_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ACT',$12)
         RETURNING id`,
        [
          flujoId,
          data.unidadOrigenId,
          data.estadoOrigenCodigo,
          data.accionCodigo,
          data.unidadDestinoId,
          data.estadoDestinoCodigo,
          data.tipoMovimientoCodigo,
          data.resultadoCodigo,
          data.requiereObservacion,
          data.requiereMotivo,
          data.permiteFinalizacion,
          usuarioCreacion,
        ]
      );
      return r.rows[0].id;
    });
  }

  async actualizarTransicion(
    id: number,
    data: {
      unidadDestinoId?: number | null;
      estadoDestinoCodigo?: string;
      tipoMovimientoCodigo?: string;
      resultadoCodigo?: string | null;
      requiereObservacion?: boolean;
      requiereMotivo?: boolean;
      permiteFinalizacion?: boolean;
    },
    usuarioModificacion: string
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.unidadDestinoId !== undefined) {
      sets.push(`unidad_destino_id = $${idx++}`);
      values.push(data.unidadDestinoId);
    }
    if (data.estadoDestinoCodigo !== undefined) {
      sets.push(`estado_destino_codigo = $${idx++}`);
      values.push(data.estadoDestinoCodigo);
    }
    if (data.tipoMovimientoCodigo !== undefined) {
      sets.push(`tipo_movimiento_codigo = $${idx++}`);
      values.push(data.tipoMovimientoCodigo);
    }
    if (data.resultadoCodigo !== undefined) {
      sets.push(`resultado_codigo = $${idx++}`);
      values.push(data.resultadoCodigo);
    }
    if (data.requiereObservacion !== undefined) {
      sets.push(`requiere_observacion = $${idx++}`);
      values.push(data.requiereObservacion);
    }
    if (data.requiereMotivo !== undefined) {
      sets.push(`requiere_motivo = $${idx++}`);
      values.push(data.requiereMotivo);
    }
    if (data.permiteFinalizacion !== undefined) {
      sets.push(`permite_finalizacion = $${idx++}`);
      values.push(data.permiteFinalizacion);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.flujo_transicion SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstadoTransicion(
    id: number,
    estado: string,
    usuarioModificacion: string
  ): Promise<void> {
    await query(
      `UPDATE ${this.schema}.flujo_transicion
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS DE CONTEXTO (las usa el módulo de requerimientos)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Acciones disponibles dado (flujo, unidad, estado_actual).
   * Usa catálogos para devolver nombres legibles y solo transiciones ACTIVAS.
   */
  async listarAccionesDisponibles(
    flujoId: number,
    unidadId: number,
    estadoActualCodigo: string | null
  ): Promise<AccionDisponibleRow[]> {
    const r = await query<AccionDisponibleRow>(
      `SELECT ft.accion_codigo,
              COALESCE(ca.nombre, ft.accion_codigo) AS accion_nombre,
              ft.unidad_destino_id,
              ud.nombre AS unidad_destino_nombre,
              ft.estado_destino_codigo,
              COALESCE(ce.nombre, ft.estado_destino_codigo) AS estado_destino_nombre,
              ft.tipo_movimiento_codigo,
              ft.resultado_codigo,
              COALESCE(cr.nombre, ft.resultado_codigo) AS resultado_nombre,
              ft.requiere_observacion,
              ft.requiere_motivo,
              ft.permite_finalizacion
         FROM ${this.schema}.flujo_transicion ft
         LEFT JOIN ${this.schema}.unidad_organizacional ud
                ON ud.id = ft.unidad_destino_id
         LEFT JOIN ${this.schema}.catalogos cat_acc
                ON cat_acc.codigo = 'ACCION_WORKFLOW'
         LEFT JOIN ${this.schema}.catalogo_detalle ca
                ON ca.catalogo_id = cat_acc.id
               AND ca.codigo = ft.accion_codigo
               AND ca.estado = 'ACT'
         LEFT JOIN ${this.schema}.catalogos cat_est
                ON cat_est.codigo = 'ESTADO_SEGUIMIENTO'
         LEFT JOIN ${this.schema}.catalogo_detalle ce
                ON ce.catalogo_id = cat_est.id
               AND ce.codigo = ft.estado_destino_codigo
               AND ce.estado = 'ACT'
         LEFT JOIN ${this.schema}.catalogos cat_res
                ON cat_res.codigo = 'RESULTADO'
         LEFT JOIN ${this.schema}.catalogo_detalle cr
                ON cr.catalogo_id = cat_res.id
               AND cr.codigo = ft.resultado_codigo
               AND cr.estado = 'ACT'
        WHERE ft.flujo_id = $1
          AND ft.unidad_origen_id = $2
          AND ft.estado = 'ACT'
          AND COALESCE(ft.estado_origen_codigo, '__INICIAL__') =
              COALESCE($3::varchar, '__INICIAL__')
        ORDER BY ft.accion_codigo`,
      [flujoId, unidadId, estadoActualCodigo]
    );
    return r.rows;
  }

  /**
   * Valida una transición puntual y devuelve sus reglas.
   * Retorna null si no existe transición activa.
   */
  async validarTransicion(
    flujoId: number,
    unidadId: number,
    estadoActualCodigo: string | null,
    accionCodigo: string
  ): Promise<TransicionValidadaRow | null> {
    const r = await query<TransicionValidadaRow>(
      `SELECT id, unidad_destino_id, estado_destino_codigo,
              tipo_movimiento_codigo, resultado_codigo,
              requiere_observacion, requiere_motivo, permite_finalizacion
         FROM ${this.schema}.flujo_transicion
        WHERE flujo_id = $1
          AND unidad_origen_id = $2
          AND accion_codigo = $3
          AND estado = 'ACT'
          AND COALESCE(estado_origen_codigo, '__INICIAL__') =
              COALESCE($4::varchar, '__INICIAL__')
        ORDER BY id DESC
        LIMIT 1`,
      [flujoId, unidadId, accionCodigo, estadoActualCodigo]
    );
    return r.rows[0] ?? null;
  }
}