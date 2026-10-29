import { PoolClient } from 'pg';
import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';

// ─────────────────────────────────────────────────────────────────────────
// Tipos de retorno
// ─────────────────────────────────────────────────────────────────────────

export interface UsuarioDetalleRow {
  id: number;
  username: string;
  email: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string | null;
  unidad_organizacional_id: number | null;
  estado: string;
  debe_cambiar_password: boolean;
  ultimo_acceso: Date | null;
  fecha_creacion: Date;
  unidad_nombre: string | null;
  rol_id: number | null;
  rol_codigo: string | null;
  rol_nombre: string | null;
}

export interface UsuarioListadoRow {
  id: number;
  username: string;
  email: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  estado: string;
  ultimo_acceso: Date | null;
  unidad_nombre: string | null;
  rol_nombre: string | null;
}

export interface RolVigenteRow {
  usuario_rol_id: number;
  rol_id: number;
  rol_codigo: string;
  rol_nombre: string;
  fecha_desde: Date;
  fecha_hasta: Date | null;
  estado: string;
}

export interface UsuarioRolRow {
  id: number;
  usuario_id: number;
  rol_id: number;
  rol_codigo: string;
  rol_nombre: string;
  fecha_desde: Date;
  fecha_hasta: Date | null;
  estado: string;
  usuario_creacion: string;
  fecha_creacion: Date;
  usuario_ultima_modificacion: string | null;
  fecha_ultima_modificacion: Date | null;
}

export interface UsuarioRolBasico {
  id: number;
  usuario_id: number;
  rol_id: number;
  estado: string;
  fecha_desde: Date;
  fecha_hasta: Date | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Repositorio
// ─────────────────────────────────────────────────────────────────────────

export class UsuarioRepository {
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async listar(params: {
    page: number;
    limit: number;
    search?: string;
    estado?: string;
    unidadId?: number;
  }) {
    const { page, limit, search, estado, unidadId } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(
        `(u.username ILIKE $${idx} OR u.nombres ILIKE $${idx} OR u.primer_apellido ILIKE $${idx} OR u.email ILIKE $${idx})`
      );
      values.push(`%${search}%`);
      idx++;
    }
    if (estado) {
      conditions.push(`u.estado = $${idx++}`);
      values.push(estado);
    }
    if (unidadId) {
      conditions.push(`u.unidad_organizacional_id = $${idx++}`);
      values.push(unidadId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.usuario u ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].total, 10);

    values.push(limit, offset);
    const dataResult = await query<UsuarioListadoRow>(
      `SELECT u.id, u.username, u.email, u.nombres, u.primer_apellido, u.segundo_apellido,
              u.estado, u.ultimo_acceso, uo.nombre AS unidad_nombre, r.nombre AS rol_nombre
         FROM ${this.schema}.usuario u
         LEFT JOIN ${this.schema}.unidad_organizacional uo
                ON uo.id = u.unidad_organizacional_id
         LEFT JOIN ${this.schema}.usuario_rol ur
                ON ur.usuario_id = u.id AND ur.estado = 'ACT'
               AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
         LEFT JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
         ${where}
        ORDER BY u.fecha_creacion DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return { data: dataResult.rows, total, page, limit };
  }

  async obtenerPorId(id: number): Promise<UsuarioDetalleRow | null> {
    const result = await query<UsuarioDetalleRow>(
      `SELECT u.id, u.username, u.email, u.tipo_documento, u.numero_documento,
              u.nombres, u.primer_apellido, u.segundo_apellido, u.telefono,
              u.unidad_organizacional_id, u.estado, u.debe_cambiar_password,
              u.ultimo_acceso, u.fecha_creacion,
              uo.nombre AS unidad_nombre,
              r.id AS rol_id, r.codigo AS rol_codigo, r.nombre AS rol_nombre
         FROM ${this.schema}.usuario u
         LEFT JOIN ${this.schema}.unidad_organizacional uo
                ON uo.id = u.unidad_organizacional_id
         LEFT JOIN ${this.schema}.usuario_rol ur
                ON ur.usuario_id = u.id AND ur.estado = 'ACT'
               AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
         LEFT JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
        WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async existeEmail(email: string, excludeId?: number): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.usuario
        WHERE LOWER(email) = LOWER($1) ${excludeId ? 'AND id <> $2' : ''}`,
      excludeId ? [email, excludeId] : [email]
    );
    return parseInt(result.rows[0].count, 10) > 0;
  }

  async actualizar(
    id: number,
    data: {
      email?: string;
      telefono?: string | null;
      unidadId?: number;
      usuarioModificacion: string;
    }
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.email !== undefined) { sets.push(`email = $${idx++}`); values.push(data.email); }
    if (data.telefono !== undefined) { sets.push(`telefono = $${idx++}`); values.push(data.telefono); }
    if (data.unidadId !== undefined) { sets.push(`unidad_organizacional_id = $${idx++}`); values.push(data.unidadId); }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(data.usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.usuario SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(
    id: number,
    estado: string,
    _motivo: string,
    usuarioModificacion: string
  ): Promise<void> {
    await query(
      `UPDATE ${this.schema}.usuario
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );

    // Inactivar rol vigente si el usuario deja de poder operar
    if (['SUS', 'INA', 'ELI', 'BLO'].includes(estado)) {
      await query(
        `UPDATE ${this.schema}.usuario_rol
            SET estado = 'INA',
                fecha_hasta = CURRENT_DATE,
                usuario_ultima_modificacion = $1,
                fecha_ultima_modificacion = CURRENT_TIMESTAMP
          WHERE usuario_id = $2 AND estado = 'ACT'`,
        [usuarioModificacion, id]
      );
    }
  }

  async resetPassword(
    id: number,
    passwordHash: string,
    usuarioModificacion: string
  ): Promise<void> {
    await query(
      `UPDATE ${this.schema}.usuario
          SET password_hash = $1,
              debe_cambiar_password = TRUE,
              intentos_fallidos = 0,
              bloqueado_hasta = NULL,
              estado = CASE WHEN estado = 'BLO' THEN 'ACT' ELSE estado END,
              password_actualizado_en = CURRENT_TIMESTAMP,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [passwordHash, usuarioModificacion, id]
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GESTIÓN DE ROLES (usuario_rol)
  // ═══════════════════════════════════════════════════════════════════════

  async obtenerRolVigente(usuarioId: number): Promise<RolVigenteRow | null> {
    const result = await query<RolVigenteRow>(
      `SELECT ur.id       AS usuario_rol_id,
              r.id        AS rol_id,
              r.codigo    AS rol_codigo,
              r.nombre    AS rol_nombre,
              ur.fecha_desde,
              ur.fecha_hasta,
              ur.estado
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id
        WHERE ur.usuario_id = $1
          AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
        ORDER BY ur.fecha_desde DESC, ur.id DESC
        LIMIT 1`,
      [usuarioId]
    );
    return result.rows[0] ?? null;
  }

  async listarRolesDeUsuario(usuarioId: number): Promise<UsuarioRolRow[]> {
    const result = await query<UsuarioRolRow>(
      `SELECT ur.id, ur.usuario_id, ur.rol_id,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre,
              ur.fecha_desde, ur.fecha_hasta, ur.estado,
              ur.usuario_creacion, ur.fecha_creacion,
              ur.usuario_ultima_modificacion, ur.fecha_ultima_modificacion
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id
        WHERE ur.usuario_id = $1
        ORDER BY ur.fecha_desde DESC, ur.id DESC`,
      [usuarioId]
    );
    return result.rows;
  }

  async contarRolesVigentes(usuarioId: number, excluirUsuarioRolId?: number): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.usuario_rol
        WHERE usuario_id = $1
          AND estado = 'ACT'
          AND (fecha_hasta IS NULL OR fecha_hasta >= CURRENT_DATE)
          ${excluirUsuarioRolId ? 'AND id <> $2' : ''}`,
      excluirUsuarioRolId ? [usuarioId, excluirUsuarioRolId] : [usuarioId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async asignarRol(
    usuarioId: number,
    rolId: number,
    _motivo: string,
    usuarioModificacion: string
  ): Promise<number> {
    return transaction(async (client: PoolClient) => {
      // 1. Inactivar roles vigentes
      await client.query(
        `UPDATE ${this.schema}.usuario_rol
            SET estado = 'INA',
                fecha_hasta = CURRENT_DATE,
                usuario_ultima_modificacion = $1,
                fecha_ultima_modificacion = CURRENT_TIMESTAMP
          WHERE usuario_id = $2
            AND estado = 'ACT'
            AND (fecha_hasta IS NULL OR fecha_hasta >= CURRENT_DATE)`,
        [usuarioModificacion, usuarioId]
      );

      // 2. Insertar nuevo rol vigente
      const result = await client.query<{ id: number }>(
        `INSERT INTO ${this.schema}.usuario_rol
           (usuario_id, rol_id, estado, usuario_creacion)
         VALUES ($1, $2, 'ACT', $3)
         RETURNING id`,
        [usuarioId, rolId, usuarioModificacion]
      );

      return result.rows[0].id;
    });
  }

  async inactivarRolVigente(
    usuarioId: number,
    usuarioModificacion: string
  ): Promise<number | null> {
    const result = await query<{ id: number }>(
      `UPDATE ${this.schema}.usuario_rol
          SET estado = 'INA',
              fecha_hasta = CURRENT_DATE,
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE usuario_id = $2
          AND estado = 'ACT'
          AND (fecha_hasta IS NULL OR fecha_hasta >= CURRENT_DATE)
        RETURNING id`,
      [usuarioModificacion, usuarioId]
    );
    return result.rows[0]?.id ?? null;
  }

  async reactivarRol(
    usuarioRolId: number,
    usuarioModificacion: string
  ): Promise<void> {
    await query(
      `UPDATE ${this.schema}.usuario_rol
          SET estado = 'ACT',
              fecha_desde = CURRENT_DATE,
              fecha_hasta = NULL,
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [usuarioModificacion, usuarioRolId]
    );
  }

  async obtenerUsuarioRolPorId(usuarioRolId: number): Promise<UsuarioRolBasico | null> {
    const result = await query<UsuarioRolBasico>(
      `SELECT id, usuario_id, rol_id, estado, fecha_desde, fecha_hasta
         FROM ${this.schema}.usuario_rol WHERE id = $1`,
      [usuarioRolId]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Crea el registro base del usuario.
   * (Se conserva para que el service lo use dentro de su propia transacción
   * o directamente si el service decide manejar la transacción).
   */
  async crear(
    client: PoolClient,
    data: {
      username: string;
      email: string;
      passwordHash: string;
      tipoDocumento: string;
      numeroDocumento: string;
      nombres: string;
      primerApellido: string;
      segundoApellido: string | null;
      telefono: string | null;
      unidadId: number;
      rolId: number;
      usuarioCreacion: string;
    }
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `INSERT INTO ${this.schema}.usuario
         (username, email, password_hash, tipo_documento, numero_documento,
          nombres, primer_apellido, segundo_apellido, telefono,
          unidad_organizacional_id, debe_cambiar_password, usuario_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11)
       RETURNING id`,
      [
        data.username,
        data.email,
        data.passwordHash,
        data.tipoDocumento,
        data.numeroDocumento,
        data.nombres,
        data.primerApellido,
        data.segundoApellido,
        data.telefono,
        data.unidadId,
        data.usuarioCreacion,
      ]
    );

    const usuarioId = result.rows[0].id;

    await client.query(
      `INSERT INTO ${this.schema}.usuario_rol
         (usuario_id, rol_id, estado, usuario_creacion)
       VALUES ($1, $2, 'ACT', $3)`,
      [usuarioId, data.rolId, data.usuarioCreacion]
    );

    return usuarioId;
  }

  /**
 * Reactiva el usuario_rol más reciente que esté inactivo, siempre que su rol
 * siga activo. Se usa al reactivar un usuario suspendido, para devolverle
 * su rol vigente automáticamente.
 *
 * Devuelve el id del usuario_rol reactivado, o null si no había ninguno.
 */
async reactivarUltimoRolInactivado(
  usuarioId: number,
  usuarioModificacion: string
): Promise<number | null> {
  const r = await query<{ id: number; rol_id: number }>(
    `SELECT ur.id, ur.rol_id
       FROM ${this.schema}.usuario_rol ur
       JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
      WHERE ur.usuario_id = $1
        AND ur.estado = 'INA'
      ORDER BY ur.fecha_desde DESC, ur.id DESC
      LIMIT 1`,
    [usuarioId]
  );

  if (r.rows.length === 0) return null;

  await query(
    `UPDATE ${this.schema}.usuario_rol
        SET estado = 'ACT',
            fecha_desde = CURRENT_DATE,
            fecha_hasta = NULL,
            usuario_ultima_modificacion = $1,
            fecha_ultima_modificacion = CURRENT_TIMESTAMP
      WHERE id = $2`,
    [usuarioModificacion, r.rows[0].id]
  );

  return r.rows[0].id;
}
}