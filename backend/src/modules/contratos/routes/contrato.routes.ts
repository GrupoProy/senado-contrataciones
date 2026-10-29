import { Router } from 'express';
import { ContratoController } from '../controllers/contrato.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  crearContratoSchema,
  actualizarContratoSchema,
  cambiarEstadoContratoSchema,
  listarContratosSchema,
} from '../dto/contrato.dto';

const router = Router();
const controller = new ContratoController();

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('CONTRATOS_VER'), validate(listarContratosSchema, 'query'), controller.listar);

router.get(
  '/requerimientos-disponibles',
  requirePermission('CONTRATOS_CREAR', 'CONTRATOS_VER'),
  controller.listarDisponibles
);

router.get('/', requirePermission('CONTRATOS_VER'), validate(listarContratosSchema, 'query'), controller.listar);
router.get('/:id', requirePermission('CONTRATOS_VER'), controller.obtenerPorId);
router.get('/:id', requirePermission('CONTRATOS_VER'), controller.obtenerPorId);
router.post('/', requirePermission('CONTRATOS_CREAR'), validate(crearContratoSchema), controller.crear);
router.put('/:id', requirePermission('CONTRATOS_EDITAR'), validate(actualizarContratoSchema), controller.actualizar);
router.patch(
  '/:id/estado',
  requirePermission('CONTRATOS_ANULAR'),
  validate(cambiarEstadoContratoSchema),
  controller.cambiarEstado
);

export default router;