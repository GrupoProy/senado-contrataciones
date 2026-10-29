import { PoolClient } from 'pg';
import { query } from '../../../config/database';
import { env } from '../../../config/env';
import {
  RequerimientoDetalleRow,
  RequerimientoListadoRow,
} from '../entities/requerimiento.entity';

export interface PersonaRow {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  complemento: string | null;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
}

export interface PersonaCompletaRow {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  complemento: string | null;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  fecha_nacimiento: Date | null;
  genero: string | null;
  estado_civil: string | null;
  nacionalidad: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  edad: number | null;
}

export class RequerimientoRepository {
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // LISTADOS
  // ═══════════════════════════════════════════════════════════════════════

  async listar(params: {
    page: number;
    limit: number;
    search?: string;
    estadoCodigo?: string;
    unidadSolicitanteId?: number;
    unidadActualId?: number;
    personaId?: number;
    senadorId?: number;
    prioridad?: string;
    tipoContrato?: string;
    tipoRequerimiento?: string;
    unidadIdRestringida?: number;
  }) {
    const {
      page, limit, search, estadoCodigo,
      unidadSolicitanteId, unidadActualId, personaId, senadorId,
      prioridad, tipoContrato, tipoRequerimiento, unidadIdRestringida,
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(
        `(r.codigo ILIKE $${idx} OR r.nro_certificacion ILIKE $${idx} OR r.titulo ILIKE $${idx} OR p.numero_documento ILIKE $${idx} OR s.nombres ILIKE $${idx} OR s.primer_apellido ILIKE $${idx})`
      );
      values.push(`%${search}%`);
      idx++;
    }
    if (estadoCodigo) {
      conditions.push(`r.estado_codigo = $${idx++}`);
      values.push(estadoCodigo);
    }
    if (unidadSolicitanteId) {
      conditions.push(`r.unidad_solicitante_id = $${idx++}`);
      values.push(unidadSolicitanteId);
    }
    if (unidadActualId) {
      conditions.push(`r.unidad_actual_id = $${idx++}`);
      values.push(unidadActualId);
    }
    if (personaId) {
      conditions.push(`r.persona_id = $${idx++}`);
      values.push(personaId);
    }
    if (senadorId) {
      conditions.push(`r.senador_id = $${idx++}`);
      values.push(senadorId);
    }
    if (prioridad) {
      conditions.push(`r.prioridad = $${idx++}`);
      values.push(prioridad);
    }
    if (tipoContrato) {
      conditions.push(`r.tipo_contrato = $${idx++}`);
      values.push(tipoContrato);
    }
    if (tipoRequerimiento) {
      conditions.push(`r.tipo_requerimiento = $${idx++}`);
      values.push(tipoRequerimiento);
    }
    if (unidadIdRestringida) {
      conditions.push(`(r.unidad_actual_id = $${idx} OR r.unidad_solicitante_id = $${idx})`);
      values.push(unidadIdRestringida);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         LEFT JOIN ${this.schema}.cargo c ON c.id = r.cargo_id
         LEFT JOIN ${this.schema}.senador s ON s.id = r.senador_id
         JOIN ${this.schema}.unidad_organizacional us ON us.id = r.unidad_solicitante_id
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
         ${where}`,
      values
    );

    const dataValues = [...values, limit, offset];

    const data = await query<RequerimientoListadoRow>(
      `SELECT r.id,
              r.codigo,
              r.nro_certificacion       AS "nroCertificacion",
              r.titulo,
              r.estado_codigo           AS "estadoCodigo",
              r.prioridad,
              r.tipo_contrato           AS "tipoContrato",
              r.tipo_requerimiento      AS "tipoRequerimiento",
              ct.nombre                 AS "tipoContratoNombre",
              cr.nombre                 AS "tipoRequerimientoNombre",
              r.fecha_solicitud         AS "fechaSolicitud",
              r.fecha_creacion          AS "fechaCreacion",
              EXTRACT(DAY FROM (CURRENT_DATE - r.fecha_creacion))::int AS "diasTranscurridos", -- ✅ NUEVO CAMPO ALERTA
              p.nombres || ' ' || p.primer_apellido AS "personaNombres",
              p.numero_documento        AS "personaDocumento",
              c.codigo                  AS "cargoCodigo",
              c.nombre                  AS "cargoNombre",
              c.salario_mes             AS "cargoSalarioMes",
              r.senador_id              AS "senadorId",
              CASE WHEN s.id IS NULL THEN NULL ELSE s.nombres || ' ' || s.primer_apellido END AS "senadorNombres",
              s.sigla_politica          AS "senadorSiglaPolitica",
              us.nombre                 AS "unidadSolicitanteNombre",
              ua.nombre                 AS "unidadActualNombre"
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         LEFT JOIN ${this.schema}.cargo c ON c.id = r.cargo_id
         LEFT JOIN ${this.schema}.senador s ON s.id = r.senador_id
         JOIN ${this.schema}.unidad_organizacional us ON us.id = r.unidad_solicitante_id
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
         LEFT JOIN ${this.schema}.catalogos cat_tc ON cat_tc.codigo = 'TIPO_CONTRATO'
         LEFT JOIN ${this.schema}.catalogo_detalle ct ON ct.catalogo_id = cat_tc.id AND ct.codigo = r.tipo_contrato
         LEFT JOIN ${this.schema}.catalogos cat_tr ON cat_tr.codigo = 'TIPO_REQUERIMIENTO'
         LEFT JOIN ${this.schema}.catalogo_detalle cr ON cr.catalogo_id = cat_tr.id AND cr.codigo = r.tipo_requerimiento
         ${where}
        ORDER BY r.fecha_creacion DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      dataValues
    );

    return {
      data: data.rows,
      total: parseInt(count.rows[0].total, 10),
      page,
      limit,
    };
  }

  async listarBandejaDerivar(unidadId: number): Promise<RequerimientoListadoRow[]> {
    const result = await query<RequerimientoListadoRow>(
      `SELECT r.id, r.codigo, r.nro_certificacion AS "nroCertificacion", r.titulo,
              r.estado_codigo AS "estadoCodigo", r.prioridad,
              r.tipo_contrato AS "tipoContrato", r.tipo_requerimiento AS "tipoRequerimiento",
              EXTRACT(DAY FROM (CURRENT_DATE - r.fecha_solicitud))::int AS "diasTranscurridos",
              p.nombres || ' ' || p.primer_apellido AS "personaNombres",
              p.numero_documento AS "personaDocumento",
              us.nombre AS "unidadSolicitanteNombre", ua.nombre AS "unidadActualNombre",
              r.fecha_solicitud AS "fechaSolicitud", r.fecha_creacion AS "fechaCreacion"
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         JOIN ${this.schema}.unidad_organizacional us ON us.id = r.unidad_solicitante_id
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
        WHERE r.unidad_actual_id = $1 AND r.estado_codigo = 'REGISTRADO' AND r.seguimiento_actual_id IS NULL
        ORDER BY r.prioridad DESC, r.fecha_creacion ASC`,
      [unidadId]
    );
    return result.rows;
  }

  async listarBandeja(unidadId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.requerimiento
        WHERE unidad_actual_id = $1 AND estado_codigo NOT IN ('FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')`,
      [unidadId]
    );

    const data = await query<RequerimientoListadoRow>(
      `SELECT r.id, r.codigo, r.nro_certificacion AS "nroCertificacion", r.titulo,
              r.estado_codigo AS "estadoCodigo", r.prioridad,
              r.tipo_contrato AS "tipoContrato", r.tipo_requerimiento AS "tipoRequerimiento",
              EXTRACT(DAY FROM (CURRENT_DATE - r.fecha_creacion))::int AS "diasTranscurridos",
              p.nombres || ' ' || p.primer_apellido AS "personaNombres",
              p.numero_documento AS "personaDocumento",
              us.nombre AS "unidadSolicitanteNombre", ua.nombre AS "unidadActualNombre",
              r.fecha_solicitud AS "fechaSolicitud", r.fecha_creacion AS "fechaCreacion"
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         JOIN ${this.schema}.unidad_organizacional us ON us.id = r.unidad_solicitante_id
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
        WHERE r.unidad_actual_id = $1 AND r.estado_codigo NOT IN ('FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')
        ORDER BY r.prioridad DESC, r.fecha_creacion ASC LIMIT $2 OFFSET $3`,
      [unidadId, limit, offset]
    );
    return { data: data.rows, total: parseInt(count.rows[0].total, 10), page, limit };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS PUNTUALES
  // ═══════════════════════════════════════════════════════════════════════

  async obtenerPorId(id: number): Promise<RequerimientoDetalleRow | null> {
    const result = await query<RequerimientoDetalleRow>(
      `SELECT r.id, r.codigo, r.codigo_grupo AS "codigoGrupo", r.nro_certificacion AS "nroCertificacion",
              r.titulo, r.descripcion, r.persona_id AS "personaId", r.cargo_id AS "cargoId", r.senador_id AS "senadorId",
              r.unidad_solicitante_id AS "unidadSolicitanteId", r.unidad_actual_id AS "unidadActualId",
              r.estado_codigo AS "estadoCodigo", r.prioridad,
              r.tipo_contrato AS "tipoContrato", r.tipo_requerimiento AS "tipoRequerimiento",
              ct.nombre AS "tipoContratoNombre", cr.nombre AS "tipoRequerimientoNombre",
              r.fecha_solicitud AS "fechaSolicitud", r.fecha_inicio_prevista AS "fechaInicioPrevista",
              r.fecha_fin_prevista AS "fechaFinPrevista", r.resultado_final_codigo AS "resultadoFinalCodigo",
              r.tipo_finalizacion_codigo AS "tipoFinalizacionCodigo", r.fecha_finalizacion AS "fechaFinalizacion",
              r.usuario_finalizacion AS "usuarioFinalizacion", r.observacion_final AS "observacionFinal",
              r.seguimiento_actual_id AS "seguimientoActualId", r.usuario_creacion AS "usuarioCreacion",
              r.fecha_creacion AS "fechaCreacion",
              p.nombres || ' ' || p.primer_apellido AS "personaNombres",
              p.numero_documento AS "personaDocumento", c.codigo AS "cargoCodigo", c.nombre AS "cargoNombre",
              c.salario_mes AS "cargoSalarioMes", us.nombre AS "unidadSolicitanteNombre", ua.nombre AS "unidadActualNombre",
              s.nombres || ' ' || s.primer_apellido AS "senadorNombres", s.numero_documento AS "senadorDocumento", s.sigla_politica AS "senadorSiglaPolitica"
         FROM ${this.schema}.requerimiento r
         JOIN ${this.schema}.persona p ON p.id = r.persona_id
         LEFT JOIN ${this.schema}.cargo c ON c.id = r.cargo_id
         LEFT JOIN ${this.schema}.senador s ON s.id = r.senador_id
         JOIN ${this.schema}.unidad_organizacional us ON us.id = r.unidad_solicitante_id
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
         LEFT JOIN ${this.schema}.catalogos cat_tc ON cat_tc.codigo = 'TIPO_CONTRATO'
         LEFT JOIN ${this.schema}.catalogo_detalle ct ON ct.catalogo_id = cat_tc.id AND ct.codigo = r.tipo_contrato
         LEFT JOIN ${this.schema}.catalogos cat_tr ON cat_tr.codigo = 'TIPO_REQUERIMIENTO'
         LEFT JOIN ${this.schema}.catalogo_detalle cr ON cr.catalogo_id = cat_tr.id AND cr.codigo = r.tipo_requerimiento
        WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async buscarPersonaPorDocumento(
    tipoDocumento: string, numeroDocumento: string, complemento: string | null, client?: PoolClient
  ): Promise<PersonaRow | null> {
    const sql = `
      SELECT id, tipo_documento, numero_documento, complemento, nombres, primer_apellido, segundo_apellido
        FROM ${this.schema}.persona
       WHERE tipo_documento = $1 AND numero_documento = $2
         AND (COALESCE(complemento, '') = COALESCE($3::varchar, ''))
       LIMIT 1`;
    const result = client ? await client.query<PersonaRow>(sql, [tipoDocumento, numeroDocumento, complemento]) : await query<PersonaRow>(sql, [tipoDocumento, numeroDocumento, complemento]);
    return result.rows[0] ?? null;
  }

  async buscarPersonaCompleta(
    tipoDocumento: string, numeroDocumento: string, complemento: string | null
  ): Promise<PersonaCompletaRow | null> {
    const r = await query<PersonaCompletaRow>(
      `SELECT id, tipo_documento, numero_documento, complemento, nombres, primer_apellido, segundo_apellido,
              fecha_nacimiento, genero, estado_civil, nacionalidad, email, telefono, direccion,
              CASE WHEN fecha_nacimiento IS NOT NULL THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))::int ELSE NULL END AS edad
         FROM ${this.schema}.persona
        WHERE tipo_documento = $1 AND numero_documento = $2
          AND (COALESCE(complemento, '') = COALESCE($3::varchar, '')) AND estado = 'ACT' LIMIT 1`,
      [tipoDocumento, numeroDocumento, complemento]
    );
    return r.rows[0] ?? null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ESCRITURA
  // ═══════════════════════════════════════════════════════════════════════

  async crear(
    client: PoolClient,
    data: {
      nroCertificacion: string; titulo: string; descripcion: string | null;
      personaId: number; cargoId: number | null; senadorId: number | null;
      unidadSolicitanteId: number; unidadActualId: number; estadoCodigo: string;
      prioridad: string; tipoContrato: string | null; tipoRequerimiento: string | null;
      fechaInicioPrevista: string | null; fechaFinPrevista: string | null;
    },
    usuarioCreacion: string
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `INSERT INTO ${this.schema}.requerimiento
         (nro_certificacion, titulo, descripcion, persona_id, cargo_id, senador_id,
          unidad_solicitante_id, unidad_actual_id, estado_codigo, prioridad,
          tipo_contrato, tipo_requerimiento, fecha_inicio_prevista, fecha_fin_prevista, usuario_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        data.nroCertificacion, data.titulo, data.descripcion, data.personaId, data.cargoId,
        data.senadorId, data.unidadSolicitanteId, data.unidadActualId, data.estadoCodigo,
        data.prioridad, data.tipoContrato, data.tipoRequerimiento, data.fechaInicioPrevista,
        data.fechaFinPrevista, usuarioCreacion,
      ]
    );
    return result.rows[0].id;
  }

  async crearPersona(
    client: PoolClient,
    data: {
      tipoDocumento: string; numeroDocumento: string; complemento: string | null;
      nombres: string; primerApellido: string; segundoApellido: string | null;
      fechaNacimiento: string | null; email: string | null; telefono: string | null;
    },
    usuarioCreacion: string
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `INSERT INTO ${this.schema}.persona
         (tipo_documento, numero_documento, complemento, nombres, primer_apellido, segundo_apellido, fecha_nacimiento, email, telefono, usuario_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [data.tipoDocumento, data.numeroDocumento, data.complemento, data.nombres, data.primerApellido, data.segundoApellido, data.fechaNacimiento, data.email, data.telefono, usuarioCreacion]
    );
    return result.rows[0].id;
  }

  async actualizar(
    id: number,
    data: {
      titulo?: string; descripcion?: string | null; prioridad?: string;
      tipoContrato?: string | null; tipoRequerimiento?: string | null;
      fechaInicioPrevista?: string | null; fechaFinPrevista?: string | null;
      personaId?: number; cargoId?: number; senadorId?: number | null; unidadSolicitanteId?: number;
    },
    usuarioModificacion: string
  ): Promise<void> {
    const mapa: Record<string, string> = {
      titulo: 'titulo', descripcion: 'descripcion', prioridad: 'prioridad',
      tipoContrato: 'tipo_contrato', tipoRequerimiento: 'tipo_requerimiento',
      fechaInicioPrevista: 'fecha_inicio_prevista', fechaFinPrevista: 'fecha_fin_prevista',
      personaId: 'persona_id', cargoId: 'cargo_id', senadorId: 'senador_id', unidadSolicitanteId: 'unidad_solicitante_id',
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(mapa)) {
      const v = (data as Record<string, unknown>)[key];
      if (v !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push(v);
      }
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(`UPDATE ${this.schema}.requerimiento SET ${sets.join(', ')} WHERE id = $${idx}`, values);
  }

  async actualizarPorAccion(
    client: PoolClient, id: number, data: { codigo?: string | null; codigoGrupo?: string | null; estadoCodigo: string; unidadActualId: number | null; seguimientoActualId: number | null; }, usuarioModificacion: string
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.codigo !== undefined && data.codigo !== null) { sets.push(`codigo = $${idx++}`); values.push(data.codigo); }
    if (data.codigoGrupo !== undefined && data.codigoGrupo !== null) { sets.push(`codigo_grupo = $${idx++}`); values.push(data.codigoGrupo); }
    sets.push(`estado_codigo = $${idx++}`); values.push(data.estadoCodigo);
    sets.push(`unidad_actual_id = $${idx++}`); values.push(data.unidadActualId);
    sets.push(`seguimiento_actual_id = $${idx++}`); values.push(data.seguimientoActualId);
    sets.push(`usuario_ultima_modificacion = $${idx++}`); values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`); values.push(id);

    await client.query(`UPDATE ${this.schema}.requerimiento SET ${sets.join(', ')} WHERE id = $${idx}`, values);
  }

  async cambiarEstado(id: number, estadoCodigo: string, usuarioModificacion: string): Promise<void> {
    await query(`UPDATE ${this.schema}.requerimiento SET estado_codigo = $1, usuario_ultima_modificacion = $2, fecha_ultima_modificacion = CURRENT_TIMESTAMP WHERE id = $3`, [estadoCodigo, usuarioModificacion, id]);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════════════════════════════════════════════
  
  async obtenerUnidadDeUsuario(usuarioId: number) {
    const r = await query<{ unidad_id: number | null; unidad_codigo: string | null }>(
      `SELECT u.unidad_organizacional_id AS unidad_id, uo.codigo AS unidad_codigo
         FROM ${this.schema}.usuario u LEFT JOIN ${this.schema}.unidad_organizacional uo ON uo.id = u.unidad_organizacional_id WHERE u.id = $1`, [usuarioId]
    );
    return r.rows[0] ?? null;
  }

  async esAdministrador(usuarioId: number): Promise<boolean> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id
        WHERE ur.usuario_id = $1 AND r.codigo = 'ADMINISTRADOR' AND ur.estado = 'ACT' AND r.estado = 'ACT' AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)`, [usuarioId]
    );
    return parseInt(r.rows[0].count, 10) > 0;
  }



    // ✅ NUEVO MÉTODO: Verifica si el usuario tiene acceso global (Of. Mayor, Admin, Supervisor)
  
  /*  async tieneAccesoGlobal(usuarioId: number): Promise<boolean> {
    const r = await query<{ tiene_acceso: boolean }>(
      `SELECT (
         EXISTS (
           SELECT 1 FROM ${this.schema}.usuario u
           JOIN ${this.schema}.unidad_organizacional uo ON uo.id = u.unidad_organizacional_id
           WHERE u.id = $1 AND uo.codigo = ''
         )
         OR
         EXISTS (
           SELECT 1 FROM ${this.schema}.usuario_rol ur
           JOIN ${this.schema}.rol r ON r.id = ur.rol_id
           WHERE ur.usuario_id = $1 
             AND r.codigo IN ('ADMINISTRADOR', 'SUPERVISOR') 
             AND ur.estado = 'ACT' AND r.estado = 'ACT' 
             AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
         )
       ) AS tiene_acceso`,
      [usuarioId]
    );
    return r.rows[0]?.tiene_acceso ?? false;
  }*/

      async tieneAccesoGlobal(usuarioId: number): Promise<boolean> {
    const r = await query<{ tiene_acceso: boolean }>(
      `SELECT (
         EXISTS (
           SELECT 1 FROM ${this.schema}.usuario u
           JOIN ${this.schema}.unidad_organizacional uo ON uo.id = u.unidad_organizacional_id
           WHERE u.id = $1 AND uo.codigo = 'OM'
         )
         OR
         EXISTS (
           SELECT 1 FROM ${this.schema}.usuario_rol ur
           JOIN ${this.schema}.rol r ON r.id = ur.rol_id
           WHERE ur.usuario_id = $1 
             -- ✅ QUITAMOS 'SUPERVISOR', SOLO DEJAMOS 'ADMINISTRADOR'
             AND r.codigo IN ('ADMINISTRADOR') 
             AND ur.estado = 'ACT' AND r.estado = 'ACT' 
             AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
         )
       ) AS tiene_acceso`,
      [usuarioId]
    );
    return r.rows[0]?.tiene_acceso ?? false;
  }

  async validarUnidadActiva(unidadId: number): Promise<boolean> {
    const r = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this.schema}.unidad_organizacional WHERE id = $1 AND estado = 'ACT'`, [unidadId]);
    return parseInt(r.rows[0].count, 10) > 0;
  }

  async validarCargoActivo(cargoId: number): Promise<boolean> {
    const r = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this.schema}.cargo WHERE id = $1 AND estado = 'ACT'`, [cargoId]);
    return parseInt(r.rows[0].count, 10) > 0;
  }

  async validarSenadorActivo(senadorId: number): Promise<boolean> {
    const r = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this.schema}.senador WHERE id = $1 AND estado = 'ACT'`, [senadorId]);
    return parseInt(r.rows[0].count, 10) > 0;
  }

  async validarPersonaMayorDeEdad(fechaNacimiento: string): Promise<boolean> {
    const r = await query<{ edad: number }>(`SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, $1::date))::int AS edad`, [fechaNacimiento]);
    return r.rows[0].edad >= 18;
  }

  async tieneRequerimientoActivo(personaId: number) {
    const r = await query<{ id: number; codigo: string | null; estado_codigo: string }>(
      `SELECT r.id, r.codigo, r.estado_codigo FROM ${this.schema}.requerimiento r WHERE r.persona_id = $1 AND r.estado_codigo NOT IN ('FINALIZADO','RECHAZADO','CONCLUIDO','ANULADO') ORDER BY r.fecha_creacion DESC LIMIT 1`, [personaId]
    );
    return r.rows.length === 0 ? { tieneActivo: false } : { tieneActivo: true, requerimientoId: r.rows[0].id, codigo: r.rows[0].codigo, estadoCodigo: r.rows[0].estado_codigo };
  }

  async tieneContratoEnCurso(personaId: number) {
    const r = await query<{ id: number; numero: string; fecha_hasta: Date }>(
      `SELECT id, numero, fecha_hasta FROM ${this.schema}.contrato WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO' ORDER BY fecha_creacion DESC LIMIT 1`, [personaId]
    );
    return r.rows.length === 0 ? { tieneContrato: false } : { tieneContrato: true, contratoId: r.rows[0].id, numero: r.rows[0].numero, fechaHasta: r.rows[0].fecha_hasta };
  }

  async obtenerProcesoActivoPorPersona(personaId: number, excludeRequerimientoId?: number) {
    let conditionExclude = '';
    const values = [personaId];
    
    if (excludeRequerimientoId) {
      conditionExclude = `AND r.id != $2`;
      values.push(excludeRequerimientoId);
    }

    const reqResult = await query<any>(
      `SELECT r.id, r.codigo, r.nro_certificacion, r.titulo, r.estado_codigo, r.prioridad, 
              r.unidad_actual_id, ua.nombre AS unidad_actual_nombre, r.fecha_solicitud, r.fecha_creacion
         FROM ${this.schema}.requerimiento r 
         LEFT JOIN ${this.schema}.unidad_organizacional ua ON ua.id = r.unidad_actual_id
        WHERE r.persona_id = $1 AND r.estado_codigo NOT IN ('FINALIZADO','RECHAZADO','CONCLUIDO','ANULADO')
          ${conditionExclude}
        ORDER BY r.fecha_creacion DESC LIMIT 1`, 
      values
    );

    const contratoResult = await query<any>(
      `SELECT id, numero, estado_codigo, fecha_desde, fecha_hasta 
         FROM ${this.schema}.contrato 
        WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO' 
        ORDER BY fecha_creacion DESC LIMIT 1`, 
      [personaId]
    );
    
    const r = reqResult.rows[0];
    const c = contratoResult.rows[0];
    
    return {
      requerimiento: r ? { id: r.id, codigo: r.codigo, nroCertificacion: r.nro_certificacion, titulo: r.titulo, estadoCodigo: r.estado_codigo, prioridad: r.prioridad, unidadActualId: r.unidad_actual_id, unidadActualNombre: r.unidad_actual_nombre, fechaSolicitud: r.fecha_solicitud, fechaCreacion: r.fecha_creacion } : null,
      contrato: c ? { id: c.id, numero: c.numero, estadoCodigo: c.estado_codigo, fechaDesde: c.fecha_desde, fechaHasta: c.fecha_hasta } : null,
    };
  }

  async existePersonaActiva(personaId: number): Promise<boolean> {
    const r = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this.schema}.persona WHERE id = $1 AND estado = 'ACT'`, [personaId]);
    return parseInt(r.rows[0].count, 10) > 0;
  }

  async obtenerEstadisticas(unidadIdRestringida?: number) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (unidadIdRestringida) {
      conditions.push(`(unidad_actual_id = $${idx} OR unidad_solicitante_id = $${idx})`);
      values.push(unidadIdRestringida);
      idx++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query<{ estado_codigo: string; total: string }>(`SELECT estado_codigo, COUNT(*)::text AS total FROM ${this.schema}.requerimiento ${where} GROUP BY estado_codigo`, values);
    const stats: Record<string, number> = {};
    result.rows.forEach((row) => { stats[row.estado_codigo] = parseInt(row.total, 10); });
    return stats;
  }
}