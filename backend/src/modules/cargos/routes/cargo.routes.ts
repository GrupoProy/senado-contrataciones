import { Router } from 'express';
import { CargoController } from '../controllers/cargo.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  crearCargoSchema,
  actualizarCargoSchema,
  cambiarEstadoSchema,
  listarCargosSchema,
} from '../dto/cargo.dto';

const router = Router();
const controller = new CargoController();

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('CARGOS_VER'), validate(listarCargosSchema, 'query'), controller.listar);
router.get('/:id', requirePermission('CARGOS_VER'), controller.obtenerPorId);
router.post('/', requirePermission('CARGOS_CREAR'), validate(crearCargoSchema), controller.crear);
router.put('/:id', requirePermission('CARGOS_EDITAR'), validate(actualizarCargoSchema), controller.actualizar);
router.patch('/:id/estado', requirePermission('CARGOS_INACTIVAR'), validate(cambiarEstadoSchema), controller.cambiarEstado);

export default router;