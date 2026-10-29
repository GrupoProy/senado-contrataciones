import { Router } from 'express';
import { z } from 'zod';
import { RolController } from '../controllers/rol.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { crearRolSchema, actualizarRolSchema } from '../dto/rol.dto';

const router = Router();
const controller = new RolController();

const cambiarEstadoSchema = z.object({ estado: z.enum(['ACT', 'INA']) });

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('ROLES_VER'), controller.listar);
router.get('/:id', requirePermission('ROLES_VER'), controller.obtenerPorId);
router.post('/', requirePermission('ROLES_CREAR'), validate(crearRolSchema), controller.crear);
router.put('/:id', requirePermission('ROLES_EDITAR'), validate(actualizarRolSchema), controller.actualizar);
router.patch(
  '/:id/estado',
  requirePermission('ROLES_INACTIVAR'),
  validate(cambiarEstadoSchema),
  controller.cambiarEstado
);

export default router;