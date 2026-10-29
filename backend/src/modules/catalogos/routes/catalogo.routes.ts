import { Router } from 'express';
import { CatalogoController } from '../controllers/catalogo.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  crearCatalogoSchema,
  actualizarCatalogoSchema,
  crearDetalleSchema,
  actualizarDetalleSchema,
  cambiarEstadoSchema,
  listarCatalogosSchema,
} from '../dto/catalogo.dto';

const router = Router();
const controller = new CatalogoController();

router.use(authenticate);
router.use(requirePasswordChange);

// Lectura: cualquier usuario con CATALOGOS_VER
router.get(
  '/',
  requirePermission('CATALOGOS_VER'),
  validate(listarCatalogosSchema, 'query'),
  controller.listar
);
router.get(
  '/codigo/:codigo',
  requirePermission('CATALOGOS_VER'),
  controller.obtenerPorCodigo
);
router.get('/:id', requirePermission('CATALOGOS_VER'), controller.obtenerPorId);

// Escritura: CATALOGOS_CREAR / CATALOGOS_EDITAR / CATALOGOS_INACTIVAR
router.post(
  '/',
  requirePermission('CATALOGOS_CREAR'),
  validate(crearCatalogoSchema),
  controller.crear
);
router.put(
  '/:id',
  requirePermission('CATALOGOS_EDITAR'),
  validate(actualizarCatalogoSchema),
  controller.actualizar
);
router.patch(
  '/:id/estado',
  requirePermission('CATALOGOS_INACTIVAR'),
  validate(cambiarEstadoSchema),
  controller.cambiarEstado
);

router.post(
  '/:id/detalles',
  requirePermission('CATALOGOS_CREAR'),
  validate(crearDetalleSchema),
  controller.crearDetalle
);
router.put(
  '/detalles/:detalleId',
  requirePermission('CATALOGOS_EDITAR'),
  validate(actualizarDetalleSchema),
  controller.actualizarDetalle
);
router.patch(
  '/detalles/:detalleId/estado',
  requirePermission('CATALOGOS_INACTIVAR'),
  validate(cambiarEstadoSchema),
  controller.cambiarEstadoDetalle
);

export default router;