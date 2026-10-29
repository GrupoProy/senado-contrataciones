import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import {
  authenticate,
  requirePasswordChange,
} from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  cambiarEstadoUsuarioSchema,
  resetPasswordSchema,
  listarUsuariosSchema,
} from '../dto/usuario.dto';
import {
  asignarRolSchema,
  inactivarRolSchema,
  reactivarRolSchema,
} from '../dto/usuario-rol.dto';

const router = Router();
const controller = new UsuarioController();

router.use(authenticate);
router.use(requirePasswordChange);

// ═══════════════════════════════════════════════════════════════════════
// IMPORTANTE: rutas específicas con sub-recurso ANTES que las genéricas /:id
// ═══════════════════════════════════════════════════════════════════════

// ─── Gestión de roles del usuario ──────────────────────────────────────
router.get(
  '/:id/rol-vigente',
  requirePermission('USUARIOS_VER'),
  controller.obtenerRolVigente
);

router.get(
  '/:id/roles',
  requirePermission('USUARIOS_VER'),
  controller.listarRolesDeUsuario
);

router.post(
  '/:id/roles',
  requirePermission('USUARIOS_ASIGNAR_ROL'),
  validate(asignarRolSchema),
  controller.asignarRol
);

router.delete(
  '/:id/roles/vigente',
  requirePermission('USUARIOS_ASIGNAR_ROL'),
  validate(inactivarRolSchema),
  controller.inactivarRol
);

router.patch(
  '/:id/roles/:usuarioRolId/reactivar',
  requirePermission('USUARIOS_ASIGNAR_ROL'),
  validate(reactivarRolSchema),
  controller.reactivarRol
);

// ─── Acciones específicas sobre el usuario ─────────────────────────────
router.patch(
  '/:id/estado',
  requirePermission('USUARIOS_EDITAR', 'USUARIOS_ELIMINAR'),
  validate(cambiarEstadoUsuarioSchema),
  controller.cambiarEstado
);

router.post(
  '/:id/reset-password',
  requirePermission('USUARIOS_RESET_PASSWORD'),
  validate(resetPasswordSchema),
  controller.resetPassword
);

// ─── CRUD de usuarios ──────────────────────────────────────────────────
router.get(
  '/',
  requirePermission('USUARIOS_VER'),
  validate(listarUsuariosSchema, 'query'),
  controller.listar
);

router.get(
  '/:id',
  requirePermission('USUARIOS_VER'),
  controller.obtenerPorId
);

router.post(
  '/',
  requirePermission('USUARIOS_CREAR'),
  validate(crearUsuarioSchema),
  controller.crear
);

router.put(
  '/:id',
  requirePermission('USUARIOS_EDITAR'),
  validate(actualizarUsuarioSchema),
  controller.actualizar
);

export default router;