import { query } from '../../../config/database';
import { env } from '../../../config/env';
import { verifyPassword, hashPassword } from '../../../shared/utils/password.util';
import { generateAccessToken, generateRefreshToken } from '../../../shared/utils/jwt.util';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/AppError';
import { LoginDto, CambiarPasswordDto } from '../dto/auth.dto';
import { parametroService } from '../../parametros/services/parametro.service';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────────────────────

interface UsuarioAuth {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  estado: string;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
  debe_cambiar_password: boolean;
  unidad_organizacional_id: number | null;
}

interface RolVigente {
  rol_id: number;
  rol_codigo: string;
  rol_nombre: string;
}

interface ParametrosAuth {
  maxIntentos: number;
  minutosBloqueo: number;
  minutosAccessToken: number;
  diasRefreshToken: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicio de Autenticación
// ─────────────────────────────────────────────────────────────────────────────

export class AuthService {
  private schema = env.db.schema;

  // ───────────────────────────────────────────────────────────────────────
  // 1. LOGIN
  // ───────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const params = this.leerParametrosAuth();
    const usuario = await this.buscarUsuarioPorUsername(dto.username);

    // Usuario inexistente → mensaje genérico
    if (!usuario) {
      console.warn(`🔐 Login fallido: username '${dto.username}' no existe`);
      await this.registrarIntento(null, dto.username, ip, userAgent, false, 'USUARIO_NO_EXISTE');
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar estado del usuario
    if (['BLO', 'SUS', 'ELI', 'INA'].includes(usuario.estado)) {
      console.warn(`🔐 Login rechazado: usuario '${usuario.username}' en estado '${usuario.estado}'`);
      await this.registrarIntento(
        usuario.id,
        dto.username,
        ip,
        userAgent,
        false,
        `ESTADO_${usuario.estado}`
      );
      throw new ForbiddenError(this.mensajePorEstado(usuario.estado));
    }

    // Verificar bloqueo temporal
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      const restanteMs = new Date(usuario.bloqueado_hasta).getTime() - Date.now();
      const minutosRestantes = Math.max(1, Math.ceil(restanteMs / 60000));

      await this.registrarIntento(
        usuario.id,
        dto.username,
        ip,
        userAgent,
        false,
        'BLOQUEADO_TEMPORAL'
      );

      throw new ForbiddenError(
        `Usuario bloqueado temporalmente. Intente de nuevo en ${minutosRestantes} minuto(s).`
      );
    }

    // Verificar contraseña
    const passwordValida = await verifyPassword(dto.password, usuario.password_hash);

    if (!passwordValida) {
      console.warn('═══════════════════════════════════════════════════════════');
      console.warn(`🔐 LOGIN FALLIDO para '${usuario.username}' - Contraseña incorrecta`);
      console.warn(`   Hash prefix: ${usuario.password_hash.substring(0, 7)} | Input len: ${dto.password.length}`);
      console.warn('═══════════════════════════════════════════════════════════');

      await this.incrementarIntentosFallidos(usuario, params.maxIntentos, params.minutosBloqueo);
      await this.registrarIntento(
        usuario.id,
        dto.username,
        ip,
        userAgent,
        false,
        'PASSWORD_INCORRECTA'
      );
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar que tenga rol vigente (regla: uno solo)
    const rolVigente = await this.obtenerRolVigente(usuario.id);
    if (!rolVigente) {
      console.warn(`🔐 Login rechazado: usuario '${usuario.username}' sin rol vigente`);
      await this.registrarIntento(
        usuario.id,
        dto.username,
        ip,
        userAgent,
        false,
        'SIN_ROL_VIGENTE'
      );
      throw new ForbiddenError(
        'El usuario no tiene un rol vigente asignado. Contacte al administrador.'
      );
    }

    // Resetear contadores y actualizar último acceso
    await query(
      `UPDATE ${this.schema}.usuario
          SET intentos_fallidos = 0,
              bloqueado_hasta = NULL,
              estado = CASE WHEN estado = 'BLO' THEN 'ACT' ELSE estado END,
              ultimo_acceso = CURRENT_TIMESTAMP,
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [usuario.username, usuario.id]
    );

    await this.registrarIntento(usuario.id, dto.username, ip, userAgent, true, null);

    // Generar tokens
    const accessToken = generateAccessToken(
      {
        usuarioId: usuario.id,
        username: usuario.username,
        unidadId: usuario.unidad_organizacional_id,
        debeCambiarPassword: usuario.debe_cambiar_password,
        rolId: rolVigente.rol_id,
      },
      params.minutosAccessToken
    );

    const refreshToken = generateRefreshToken(usuario.id, params.diasRefreshToken);

    await this.guardarRefreshToken(
      usuario.id,
      refreshToken,
      params.diasRefreshToken,
      ip,
      userAgent
    );

    console.log(`✅ Login exitoso: '${usuario.username}' (rol: ${rolVigente.rol_codigo})`);

    return {
      accessToken,
      refreshToken,
      debeCambiarPassword: usuario.debe_cambiar_password,
      expiraEnMinutos: params.minutosAccessToken,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombres: usuario.nombres,
        primerApellido: usuario.primer_apellido,
        segundoApellido: usuario.segundo_apellido,
        unidadId: usuario.unidad_organizacional_id,
        rol: {
          id: rolVigente.rol_id,
          codigo: rolVigente.rol_codigo,
          nombre: rolVigente.rol_nombre,
        },
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 2. CAMBIO DE CONTRASEÑA
  // ───────────────────────────────────────────────────────────────────────
  async cambiarPassword(usuarioId: number, dto: CambiarPasswordDto) {
    const usuario = await this.buscarUsuarioPorId(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    const passwordValida = await verifyPassword(dto.passwordActual, usuario.password_hash);
    if (!passwordValida) {
      throw new UnauthorizedError('La contraseña actual es incorrecta');
    }

    const nuevoHash = await hashPassword(dto.passwordNueva);

    await query(
      `UPDATE ${this.schema}.usuario
          SET password_hash = $1,
              debe_cambiar_password = FALSE,
              password_actualizado_en = CURRENT_TIMESTAMP,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [nuevoHash, usuario.username, usuarioId]
    );

    // Revocar sesiones y tokens activos
    await query(
      `UPDATE ${this.schema}.refresh_token
          SET revocado = TRUE,
              revocado_en = CURRENT_TIMESTAMP,
              estado = 'REV',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE usuario_id = $2 AND revocado = FALSE`,
      [usuario.username, usuarioId]
    );

    await query(
      `UPDATE ${this.schema}.sesion
          SET estado = 'CER',
              fecha_cierre = CURRENT_TIMESTAMP,
              motivo_cierre = 'CAMBIO_PASSWORD',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE usuario_id = $2 AND estado = 'ACT'`,
      [usuario.username, usuarioId]
    );

    return {
      message: 'Contraseña cambiada exitosamente. Debe volver a iniciar sesión.',
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3. LOGOUT
  // ───────────────────────────────────────────────────────────────────────
  async logout(usuarioId: number, motivo = 'LOGOUT_USUARIO') {
    const usuario = await this.buscarUsuarioPorId(usuarioId);
    const usernameMod = usuario?.username ?? 'sistema';

    await query(
      `UPDATE ${this.schema}.refresh_token
          SET revocado = TRUE,
              revocado_en = CURRENT_TIMESTAMP,
              estado = 'REV',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE usuario_id = $2 AND revocado = FALSE`,
      [usernameMod, usuarioId]
    );

    await query(
      `UPDATE ${this.schema}.sesion
          SET estado = 'CER',
              fecha_cierre = CURRENT_TIMESTAMP,
              motivo_cierre = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE usuario_id = $3 AND estado = 'ACT'`,
      [motivo, usernameMod, usuarioId]
    );

    return { message: 'Sesión cerrada exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4. MI PERFIL
  // ───────────────────────────────────────────────────────────────────────
  async miPerfil(usuarioId: number) {
    const result = await query<{
      id: number;
      username: string;
      email: string;
      nombres: string;
      primer_apellido: string;
      segundo_apellido: string | null;
      telefono: string | null;
      tipo_documento: string | null;
      numero_documento: string | null;
      estado: string;
      unidad_id: number | null;
      unidad_nombre: string | null;
      rol_codigo: string | null;
      rol_nombre: string | null;
      ultimo_acceso: Date | null;
      debe_cambiar_password: boolean;
    }>(
      `SELECT u.id, u.username, u.email, u.nombres, u.primer_apellido, u.segundo_apellido,
              u.telefono, u.tipo_documento, u.numero_documento, u.estado,
              u.unidad_organizacional_id AS unidad_id, uo.nombre AS unidad_nombre,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre,
              u.ultimo_acceso, u.debe_cambiar_password
         FROM ${this.schema}.usuario u
         LEFT JOIN ${this.schema}.unidad_organizacional uo ON uo.id = u.unidad_organizacional_id
         LEFT JOIN ${this.schema}.usuario_rol ur ON ur.usuario_id = u.id
               AND ur.estado = 'ACT' AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
         LEFT JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
        WHERE u.id = $1`,
      [usuarioId]
    );

    if (result.rows.length === 0) throw new NotFoundError('Usuario no encontrado');
    const row = result.rows[0];

    const permisosResult = await query<{ clave: string }>(
      `SELECT DISTINCT p.clave
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
         JOIN ${this.schema}.rol_permiso rp ON rp.rol_id = r.id AND rp.estado = 'ACT'
         JOIN ${this.schema}.permiso p ON p.id = rp.permiso_id AND p.estado = 'ACT'
        WHERE ur.usuario_id = $1
          AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)`,
      [usuarioId]
    );

    return {
      ...row,
      permisos: permisosResult.rows.map((p) => p.clave),
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5. REFRESH TOKEN
  // ───────────────────────────────────────────────────────────────────────
   async refrescarToken(refreshToken: string, ip?: string, userAgent?: string) {
    const { verifyRefreshToken } = await import('../../../shared/utils/jwt.util');

    try {
      // ✅ FIX: Ya no guardamos el usuarioId porque usamos el hash de la BD
      verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const result = await query<{
      id: number;
      usuario_id: number;
      expira_en: Date;
      revocado: boolean;
    }>(
      `SELECT id, usuario_id, expira_en, revocado
         FROM ${this.schema}.refresh_token
        WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Refresh token no reconocido');
    }

    const rt = result.rows[0];
    if (rt.revocado) throw new UnauthorizedError('Refresh token revocado');
    if (new Date(rt.expira_en) < new Date()) {
      throw new UnauthorizedError('Refresh token expirado');
    }

    const usuario = await this.buscarUsuarioPorId(rt.usuario_id);
    if (!usuario || ['BLO', 'SUS', 'ELI', 'INA'].includes(usuario.estado)) {
      throw new ForbiddenError('Usuario no habilitado para renovar sesión');
    }

    const rolVigente = await this.obtenerRolVigente(usuario.id);
    if (!rolVigente) {
      throw new ForbiddenError('El usuario no tiene un rol vigente asignado');
    }

    const params = this.leerParametrosAuth();

    await query(
      `UPDATE ${this.schema}.refresh_token
          SET revocado = TRUE,
              revocado_en = CURRENT_TIMESTAMP,
              estado = 'REV',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [usuario.username, rt.id]
    );

    const nuevoAccessToken = generateAccessToken(
      {
        usuarioId: usuario.id,
        username: usuario.username,
        unidadId: usuario.unidad_organizacional_id,
        debeCambiarPassword: usuario.debe_cambiar_password,
        rolId: rolVigente.rol_id,
      },
      params.minutosAccessToken
    );

    const nuevoRefreshToken = generateRefreshToken(usuario.id, params.diasRefreshToken);

    await this.guardarRefreshToken(
      usuario.id,
      nuevoRefreshToken,
      params.diasRefreshToken,
      ip,
      userAgent,
      rt.id
    );

    return {
      accessToken: nuevoAccessToken,
      refreshToken: nuevoRefreshToken,
      debeCambiarPassword: usuario.debe_cambiar_password,
      expiraEnMinutos: params.minutosAccessToken,
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // 6. DIAGNÓSTICO (Solo Desarrollo)
  // ───────────────────────────────────────────────────────────────────────
  async diagnosticarCredenciales(username: string, password: string) {
    const usuario = await this.buscarUsuarioPorUsername(username);

    if (!usuario) {
      return { usuarioExiste: false, motivo: `Usuario '${username}' no encontrado` };
    }

    const passwordValida = await verifyPassword(password, usuario.password_hash);
    const rolVigente = await this.obtenerRolVigente(usuario.id);

    return {
      usuarioExiste: true,
      username: usuario.username,
      email: usuario.email,
      estado: usuario.estado,
      passwordCorrecta: passwordValida,
      debeCambiarPassword: usuario.debe_cambiar_password,
      intentosFallidos: usuario.intentos_fallidos,
      bloqueadoHasta: usuario.bloqueado_hasta,
      rolVigente: rolVigente ? { codigo: rolVigente.rol_codigo, nombre: rolVigente.rol_nombre } : null,
      diagnostico: {
        hashPrefix: usuario.password_hash.substring(0, 7),
        hashLength: usuario.password_hash.length,
        inputPasswordLength: password.length,
        inputPasswordPreview: `${password.substring(0, 3)}***`,
        puedeIniciarSesion:
          passwordValida &&
          usuario.estado === 'ACT' &&
          rolVigente !== null &&
          (!usuario.bloqueado_hasta || new Date(usuario.bloqueado_hasta) < new Date()),
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ───────────────────────────────────────────────────────────────────────

  private leerParametrosAuth(): ParametrosAuth {
    return {
      maxIntentos: parametroService.getInt('AUTH_MAX_LOGIN_ATTEMPTS', 5),
      minutosBloqueo: parametroService.getInt('AUTH_LOCK_MINUTES', 15),
      minutosAccessToken: parametroService.getInt('AUTH_ACCESS_TOKEN_MINUTES', 15),
      diasRefreshToken: parametroService.getInt('AUTH_REFRESH_TOKEN_DAYS', 7),
    };
  }

  private mensajePorEstado(estado: string): string {
    switch (estado) {
      case 'BLO': return 'Usuario bloqueado. Contacte al administrador.';
      case 'SUS': return 'Usuario suspendido. Contacte al administrador.';
      case 'INA': return 'Usuario inactivo. Contacte al administrador.';
      case 'ELI': return 'Usuario eliminado.';
      default: return 'Usuario no habilitado para iniciar sesión.';
    }
  }

  private async buscarUsuarioPorUsername(username: string): Promise<UsuarioAuth | null> {
    const result = await query<UsuarioAuth>(
      `SELECT id, username, email, password_hash, nombres, primer_apellido, segundo_apellido,
              estado, intentos_fallidos, bloqueado_hasta, debe_cambiar_password,
              unidad_organizacional_id
         FROM ${this.schema}.usuario
        WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    return result.rows[0] ?? null;
  }

  private async buscarUsuarioPorId(id: number): Promise<UsuarioAuth | null> {
    const result = await query<UsuarioAuth>(
      `SELECT id, username, email, password_hash, nombres, primer_apellido, segundo_apellido,
              estado, intentos_fallidos, bloqueado_hasta, debe_cambiar_password,
              unidad_organizacional_id
         FROM ${this.schema}.usuario
        WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  private async obtenerRolVigente(usuarioId: number): Promise<RolVigente | null> {
    const result = await query<RolVigente>(
      `SELECT r.id AS rol_id, r.codigo AS rol_codigo, r.nombre AS rol_nombre
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
        WHERE ur.usuario_id = $1
          AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
        ORDER BY ur.fecha_desde DESC, ur.id DESC
        LIMIT 1`,
      [usuarioId]
    );
    return result.rows[0] ?? null;
  }

  private async incrementarIntentosFallidos(
    usuario: UsuarioAuth,
    maxIntentos: number,
    minutosBloqueo: number
  ): Promise<void> {
    const nuevosIntentos = usuario.intentos_fallidos + 1;
    const debeBloquear = nuevosIntentos >= maxIntentos;
    const bloqueadoHasta = debeBloquear ? new Date(Date.now() + minutosBloqueo * 60 * 1000) : null;

    await query(
      `UPDATE ${this.schema}.usuario
          SET intentos_fallidos = $1,
              bloqueado_hasta = $2,
              estado = $3,
              usuario_ultima_modificacion = $4,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $5`,
      [
        nuevosIntentos,
        bloqueadoHasta,
        debeBloquear ? 'BLO' : usuario.estado,
        usuario.username,
        usuario.id,
      ]
    );

    if (debeBloquear) {
      console.warn(`🔒 Usuario '${usuario.username}' BLOQUEADO por ${minutosBloqueo} min.`);
    }
  }

  private async registrarIntento(
    usuarioId: number | null,
    username: string,
    ip: string | undefined,
    userAgent: string | undefined,
    exitoso: boolean,
    motivoFallo: string | null
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO ${this.schema}.intento_login
           (username, usuario_id, ip, user_agent, exitoso, motivo_fallo)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [username, usuarioId, ip ?? null, userAgent ?? null, exitoso, motivoFallo]
      );
    } catch (e) {
      console.error('⚠️  No se pudo registrar intento de login:', e);
    }
  }

  private async guardarRefreshToken(
    usuarioId: number,
    token: string,
    vigenciaDias: number,
    ip?: string,
    userAgent?: string,
    reemplazadoPorId?: number
  ): Promise<void> {
    const expiraEn = new Date(Date.now() + vigenciaDias * 24 * 60 * 60 * 1000);
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (reemplazadoPorId) {
      await query(
        `UPDATE ${this.schema}.refresh_token
            SET reemplazado_por = (SELECT id FROM ${this.schema}.refresh_token WHERE token_hash = $1 LIMIT 1)
          WHERE id = $2`,
        [tokenHash, reemplazadoPorId]
      );
    }

    await query(
      `INSERT INTO ${this.schema}.refresh_token
         (usuario_id, token_hash, expira_en, ip_creacion, user_agent, usuario_creacion)
       VALUES ($1, $2, $3, $4, $5, 'sistema')`,
      [usuarioId, tokenHash, expiraEn, ip ?? null, userAgent ?? null]
    );
  }
}