import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { generarUsernameUnico } from '../../../shared/utils/username.util';
import { hashPassword, generateTemporaryPassword } from '../../../shared/utils/password.util';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/AppError';
import {
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  CambiarEstadoUsuarioDto,
  ResetPasswordDto,
  ListarUsuariosDto,
} from '../dto/usuario.dto';
import {
  AsignarRolDto,
  InactivarRolDto,
  ReactivarRolDto,
} from '../dto/usuario-rol.dto';

export class UsuarioService {
  private repository = new UsuarioRepository();
  private schema = env.db.schema;

  // ─────────────────────────────────────────────────────────────────────
  // CRUD de usuarios
  // ─────────────────────────────────────────────────────────────────────

  async listar(dto: ListarUsuariosDto) {
    return this.repository.listar(dto);
  }

  async obtenerPorId(id: number) {
    const usuario = await this.repository.obtenerPorId(id);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    return usuario;
  }





async crear(dto: CrearUsuarioDto, usuarioCreacion: string) {
  if (await this.repository.existeEmail(dto.email)) {
    throw new ConflictError('El email ya está registrado');
  }
  await this.validarUnidad(dto.unidadOrganizacionalId);
  await this.validarRol(dto.rolId);

  const username =
    dto.username ??
    (await generarUsernameUnico(
      dto.nombres,
      dto.primerApellido,
      dto.segundoApellido ?? null
    ));

  const existeUsername = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${this.schema}.usuario WHERE LOWER(username) = LOWER($1)`,
    [username]
  );
  if (parseInt(existeUsername.rows[0].count, 10) > 0) {
    throw new ConflictError('El username ya está en uso');
  }

  const passwordTemporal = generateTemporaryPassword();
  const passwordHash = await hashPassword(passwordTemporal);

  const usuarioId = await transaction(async (client) => {
    const insertUsuario = await client.query<{ id: number }>(
      `INSERT INTO ${this.schema}.usuario
         (username, email, password_hash, tipo_documento, numero_documento,
          nombres, primer_apellido, segundo_apellido, telefono,
          unidad_organizacional_id, debe_cambiar_password, usuario_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11)
       RETURNING id`,
      [
        username,
        dto.email,
        passwordHash,
        dto.tipoDocumento,
        dto.numeroDocumento,
        dto.nombres,
        dto.primerApellido,
        dto.segundoApellido ?? null,
        dto.telefono ?? null,
        dto.unidadOrganizacionalId,
        usuarioCreacion,
      ]
    );
    const uId = insertUsuario.rows[0].id;

    await client.query(
      `INSERT INTO ${this.schema}.usuario_rol
         (usuario_id, rol_id, estado, usuario_creacion)
       VALUES ($1, $2, 'ACT', $3)`,
      [uId, dto.rolId, usuarioCreacion]
    );

    return uId;
  });

  return {
    id: usuarioId,
    username,
    passwordTemporal,
    mensaje:
      'Usuario creado. Debe cambiar la contraseña en el primer inicio de sesión.',
  };
}

  async actualizar(id: number, dto: ActualizarUsuarioDto, usuarioModificacion: string) {
    const usuario = await this.repository.obtenerPorId(id);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    if (dto.email && (await this.repository.existeEmail(dto.email, id))) {
      throw new ConflictError('El email ya está registrado por otro usuario');
    }
    if (dto.unidadOrganizacionalId) {
      await this.validarUnidad(dto.unidadOrganizacionalId);
    }

    await this.repository.actualizar(id, { ...dto, usuarioModificacion });
    return { message: 'Usuario actualizado exitosamente' };
  }

async cambiarEstado(
  id: number,
  dto: CambiarEstadoUsuarioDto,
  usuarioModificacion: string
) {
  const usuario = await this.repository.obtenerPorId(id);
  if (!usuario) throw new NotFoundError('Usuario no encontrado');

  // Salvaguarda: no dejarse a sí mismo sin acceso
  if (usuario.username === usuarioModificacion) {
    if (['SUS', 'INA', 'ELI'].includes(dto.estado)) {
      throw new ValidationError(
        'No puede suspender, inactivar ni eliminar su propio usuario'
      );
    }
  }

  if (usuario.estado === 'ELI') {
    throw new ValidationError('El usuario ya está eliminado');
  }

  // Al reactivar, intentar recuperar el último rol inactivado
  let rolRecuperadoId: number | null = null;
  if (dto.estado === 'ACT') {
    const rolVigente = await this.repository.obtenerRolVigente(id);
    if (!rolVigente) {
      rolRecuperadoId = await this.repository.reactivarUltimoRolInactivado(
        id,
        usuarioModificacion
      );
    }
  }

  await this.repository.cambiarEstado(id, dto.estado, dto.motivo, usuarioModificacion);

  const etiquetas: Record<string, string> = {
    ACT: 'activado',
    INA: 'inactivado',
    SUS: 'suspendido',
    BLO: 'bloqueado',
    ELI: 'eliminado lógicamente',
  };

  const advertencia =
    dto.estado === 'ACT' && !rolRecuperadoId
      ? 'El usuario no tiene rol vigente. Asigne uno con POST /api/usuarios/:id/roles.'
      : null;

  return {
    message: `Usuario ${etiquetas[dto.estado] ?? dto.estado} exitosamente`,
    estado: dto.estado,
    rolRecuperadoId,
    advertencia,
  };
}

  async resetPassword(id: number, dto: ResetPasswordDto, usuarioModificacion: string) {
    const usuario = await this.repository.obtenerPorId(id);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    const passwordTemporal = generateTemporaryPassword();
    const passwordHash = await hashPassword(passwordTemporal);

    await this.repository.resetPassword(id, passwordHash, usuarioModificacion);

    return {
      username: usuario.username,
      passwordTemporal,
      motivo: dto.motivo,
      mensaje:
        'Contraseña reseteada. El usuario debe cambiarla en su próximo inicio de sesión.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Gestión de roles del usuario
  // ─────────────────────────────────────────────────────────────────────

  async obtenerRolVigente(usuarioId: number) {
    const usuario = await this.repository.obtenerPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    const rol = await this.repository.obtenerRolVigente(usuarioId);
    return {
      usuarioId,
      username: usuario.username,
      rolVigente: rol
        ? {
            usuarioRolId: rol.usuario_rol_id,
            rolId: rol.rol_id,
            rolCodigo: rol.rol_codigo,
            rolNombre: rol.rol_nombre,
            fechaDesde: rol.fecha_desde,
            fechaHasta: rol.fecha_hasta,
          }
        : null,
    };
  }

  async listarRolesDeUsuario(usuarioId: number) {
    const usuario = await this.repository.obtenerPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    return {
      usuarioId,
      username: usuario.username,
      roles: await this.repository.listarRolesDeUsuario(usuarioId),
    };
  }

  async asignarRol(usuarioId: number, dto: AsignarRolDto, usuarioModificacion: string) {
    const usuario = await this.repository.obtenerPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    if (['ELI', 'INA'].includes(usuario.estado)) {
      throw new ValidationError(
        `No se puede asignar rol a un usuario en estado '${usuario.estado}'`
      );
    }

    const rolValido = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.rol
        WHERE id = $1 AND estado = 'ACT'`,
      [dto.rolId]
    );
    if (parseInt(rolValido.rows[0].count, 10) === 0) {
      throw new ValidationError('El rol no existe o está inactivo');
    }

    const rolActual = await this.repository.obtenerRolVigente(usuarioId);
    if (rolActual && rolActual.rol_id === dto.rolId) {
      throw new ConflictError(
        `El usuario ya tiene asignado el rol '${rolActual.rol_codigo}' como vigente`
      );
    }

    const usuarioRolId = await this.repository.asignarRol(
      usuarioId,
      dto.rolId,
      dto.motivo,
      usuarioModificacion
    );

    return {
      message: rolActual
        ? `Rol cambiado de '${rolActual.rol_codigo}' al nuevo rol exitosamente`
        : 'Rol asignado exitosamente',
      usuarioRolId,
      rolAnterior: rolActual
        ? { rolId: rolActual.rol_id, rolCodigo: rolActual.rol_codigo }
        : null,
    };
  }

  async inactivarRol(usuarioId: number, _dto: InactivarRolDto, usuarioModificacion: string) {
    const usuario = await this.repository.obtenerPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    const rolActual = await this.repository.obtenerRolVigente(usuarioId);
    if (!rolActual) {
      throw new ValidationError('El usuario no tiene un rol vigente para inactivar');
    }

    // Salvaguarda: no dejar al último administrador sin rol
    if (rolActual.rol_codigo === 'ADMINISTRADOR') {
      const admins = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
           FROM ${this.schema}.usuario_rol ur
           JOIN ${this.schema}.rol r ON r.id = ur.rol_id
           JOIN ${this.schema}.usuario u ON u.id = ur.usuario_id
          WHERE r.codigo = 'ADMINISTRADOR'
            AND ur.estado = 'ACT'
            AND u.estado = 'ACT'
            AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)`
      );
      if (parseInt(admins.rows[0].count, 10) <= 1) {
        throw new ValidationError(
          'No se puede inactivar el rol del último administrador vigente del sistema'
        );
      }
    }

    await this.repository.inactivarRolVigente(usuarioId, usuarioModificacion);

    return {
      message: `Rol '${rolActual.rol_codigo}' inactivado. El usuario queda sin rol vigente.`,
      rolInactivado: {
        usuarioRolId: rolActual.usuario_rol_id,
        rolId: rolActual.rol_id,
        rolCodigo: rolActual.rol_codigo,
      },
    };
  }

  async reactivarRol(
    usuarioId: number,
    usuarioRolId: number,
    _dto: ReactivarRolDto,
    usuarioModificacion: string
  ) {
    const usuario = await this.repository.obtenerPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    const usuarioRol = await this.repository.obtenerUsuarioRolPorId(usuarioRolId);
    if (!usuarioRol) throw new NotFoundError('Asignación de rol no encontrada');
    if (usuarioRol.usuario_id !== usuarioId) {
      throw new ValidationError('La asignación de rol no pertenece a este usuario');
    }
    if (usuarioRol.estado === 'ACT') {
      throw new ConflictError('El rol ya está activo');
    }

    // Regla: no más de un rol vigente
    const vigentes = await this.repository.contarRolesVigentes(usuarioId, usuarioRolId);
    if (vigentes > 0) {
      throw new ConflictError(
        'No se puede reactivar: el usuario ya tiene un rol vigente. Inactívelo primero.'
      );
    }

    const rolValido = await query<{ estado: string; codigo: string }>(
      `SELECT estado, codigo FROM ${this.schema}.rol WHERE id = $1`,
      [usuarioRol.rol_id]
    );
    if (rolValido.rows.length === 0) {
      throw new ValidationError('El rol asociado ya no existe');
    }
    if (rolValido.rows[0].estado !== 'ACT') {
      throw new ValidationError(
        `No se puede reactivar: el rol '${rolValido.rows[0].codigo}' está inactivo`
      );
    }

    if (['ELI', 'INA'].includes(usuario.estado)) {
      throw new ValidationError(
        `No se puede reactivar el rol: el usuario está en estado '${usuario.estado}'`
      );
    }

    await this.repository.reactivarRol(usuarioRolId, usuarioModificacion);

    return {
      message: 'Rol reactivado exitosamente',
      usuarioRolId,
      rolId: usuarioRol.rol_id,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Validaciones privadas
  // ─────────────────────────────────────────────────────────────────────

  private async validarUnidad(unidadId: number): Promise<void> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.unidad_organizacional
        WHERE id = $1 AND estado = 'ACT'`,
      [unidadId]
    );
    if (parseInt(result.rows[0].count, 10) === 0) {
      throw new ValidationError('La unidad organizacional no existe o está inactiva');
    }
  }

  private async validarRol(rolId: number): Promise<void> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.rol
        WHERE id = $1 AND estado = 'ACT'`,
      [rolId]
    );
    if (parseInt(result.rows[0].count, 10) === 0) {
      throw new ValidationError('El rol no existe o está inactivo');
    }
  }
}