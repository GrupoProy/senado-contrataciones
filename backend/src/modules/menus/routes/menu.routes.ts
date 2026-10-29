import { Router } from 'express';
import { z } from 'zod';
import { MenuController } from '../controllers/menu.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { crearMenuSchema, actualizarMenuSchema } from '../dto/menu.dto';

const router = Router();
const controller = new MenuController();

const cambiarEstadoSchema = z.object({ estado: z.enum(['ACT', 'INA']) });

router.use(authenticate);
router.use(requirePasswordChange);

// Menús del usuario actual (sin permiso especial)
router.get('/mis-menus', controller.misMenus);

// Administración
router.get('/', requirePermission('MENUS_VER'), controller.listar);
router.get('/:id', requirePermission('MENUS_VER'), controller.obtenerPorId);
router.post('/', requirePermission('MENUS_CREAR'), validate(crearMenuSchema), controller.crear);
router.put('/:id', requirePermission('MENUS_EDITAR'), validate(actualizarMenuSchema), controller.actualizar);
router.patch(
  '/:id/estado',
  requirePermission('MENUS_INACTIVAR'),
  validate(cambiarEstadoSchema),
  controller.cambiarEstado
);

export default router;