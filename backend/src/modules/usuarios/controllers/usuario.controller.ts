import { Request, Response, NextFunction } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { ListarUsuariosDto } from '../dto/usuario.dto';
import { query } from '../../../config/database'; 

const service = new UsuarioService();

export class UsuarioController {
  // ═══════════════════════════════════════════════════════════════════════
  // CRUD DE USUARIOS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * GET /api/usuarios
   * Lista usuarios con paginación, búsqueda y filtros.
   * Permiso: USUARIOS_VER
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listar(req.query as unknown as ListarUsuariosDto);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /api/usuarios/:id
   * Detalle de un usuario (incluye unidad, rol vigente, estado).
   * Permiso: USUARIOS_VER
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/usuarios
   * Crea un usuario. Requiere rol y unidad.
   * Devuelve contraseña temporal que debe cambiarse en el primer login.
   * Permiso: USUARIOS_CREAR
   */
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crear(req.body, req.user!.username);
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Actualiza email, teléfono y/o unidad. NO permite cambiar rol
   * (para eso existe POST /:id/roles).
   * Permiso: USUARIOS_EDITAR
   */
  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizar(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /api/usuarios/:id/estado
   * Suspende, reactiva, inactiva, bloquea o elimina lógicamente.
   * Permiso: USUARIOS_EDITAR o USUARIOS_ELIMINAR
   */
  async cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.cambiarEstado(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/usuarios/:id/reset-password
   * Genera contraseña temporal. El usuario deberá cambiarla en el próximo login.
   * Permiso: USUARIOS_RESET_PASSWORD
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.resetPassword(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GESTIÓN DE ROLES DEL USUARIO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * GET /api/usuarios/:id/rol-vigente
   * Devuelve el rol activo actual (o null si no tiene).
   * Regla: un usuario solo puede tener un rol vigente.
   * Permiso: USUARIOS_VER
   */
  async obtenerRolVigente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerRolVigente(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /api/usuarios/:id/roles
   * Historial completo de roles (activos e inactivos).
   * Permiso: USUARIOS_VER
   */
  async listarRolesDeUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listarRolesDeUsuario(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/usuarios/:id/roles
   * Asigna o cambia el rol vigente del usuario.
   * Inactiva automáticamente el rol previo si existiera.
   * Permiso: USUARIOS_ASIGNAR_ROL
   */
  async asignarRol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.asignarRol(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * DELETE /api/usuarios/:id/roles/vigente
   * Inactiva el rol vigente. El usuario queda sin rol hasta reasignación.
   * Salvaguarda: no permite dejar al último administrador sin rol.
   * Permiso: USUARIOS_ASIGNAR_ROL
   */
  async inactivarRol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.inactivarRol(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /api/usuarios/:id/roles/:usuarioRolId/reactivar
   * Reactiva una asignación de rol previamente inactivada.
   * Requiere que el usuario no tenga otro rol vigente.
   * Permiso: USUARIOS_ASIGNAR_ROL
   */
  async reactivarRol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.reactivarRol(
        Number(req.params.id),
        Number(req.params.usuarioRolId),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }


  // src/modules/usuarios/controllers/usuario.controller.ts
async desbloquear(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    // 1. Resetea los intentos y el bloqueo en la BD
    await query(
      `UPDATE contrataciones.usuario 
          SET intentos_fallidos = 0, bloqueado_hasta = NULL, estado = 'ACT', 
              usuario_ultima_modificacion = $1, fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [req.user!.username, id]
    );
    
    // 2. (Opcional) Si usas un store de rate-limit, aquí podrías llamar a loginLimiter.resetKey(...)
    
    res.json({ success: true, message: 'Usuario desbloqueado correctamente' });
  } catch (e) {
    next(e);
  }
}
}