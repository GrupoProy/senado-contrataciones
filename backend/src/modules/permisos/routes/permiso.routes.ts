import { Router } from 'express';
import { z } from 'zod';
import { PermisoController } from '../controllers/permiso.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { crearPermisoSchema } from '../dto/permiso.dto';

const router = Router();
const controller = new PermisoController();

const cambiarEstadoSchema = z.object({ estado: z.enum(['ACT', 'INA']) });

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('PERMISOS_VER'), controller.listar);
router.get('/agrupados', requirePermission('PERMISOS_VER'), controller.agrupados);
router.get('/:id', requirePermission('PERMISOS_VER'), controller.obtenerPorId);
router.post('/', requirePermission('PERMISOS_CREAR'), validate(crearPermisoSchema), controller.crear);
router.patch(
  '/:id/estado',
  requirePermission('PERMISOS_INACTIVAR'),
  validate(cambiarEstadoSchema),
  controller.cambiarEstado
);

export default router;