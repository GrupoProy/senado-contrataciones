import { Router } from 'express';
import { MatrizController } from '../controllers/matriz.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { sincronizarMatrizSchema } from '../dto/matriz.dto';

const router = Router();
const controller = new MatrizController();

router.use(authenticate);
router.use(requirePasswordChange);

// Matriz del usuario autenticado (sin permiso especial)
router.get('/mi-matriz', controller.miMatriz);

// Administración (solo con permisos)
router.get(
  '/roles',
  requirePermission('ROLES_VER', 'ROLES_ASIGNAR_PERMISOS'),
  controller.listarRoles
);
router.get(
  '/roles/:rolId',
  requirePermission('ROLES_VER', 'ROLES_ASIGNAR_PERMISOS', 'ROLES_ASIGNAR_MENUS'),
  controller.obtenerMatrizRol
);
router.put(
  '/roles/:rolId/sincronizar',
  requirePermission('ROLES_ASIGNAR_PERMISOS', 'ROLES_ASIGNAR_MENUS'),
  validate(sincronizarMatrizSchema),
  controller.sincronizar
);

export default router;