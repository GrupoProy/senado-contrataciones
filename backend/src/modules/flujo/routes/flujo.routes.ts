import { Router } from 'express';
import { FlujoController } from '../controllers/flujo.controller';
import {
  authenticate,
  requirePasswordChange,
} from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  crearFlujoSchema,
  actualizarFlujoSchema,
  cambiarEstadoFlujoSchema,
  listarFlujosSchema,
  crearTransicionSchema,
  actualizarTransicionSchema,
  cambiarEstadoTransicionSchema,
  listarTransicionesSchema,
  consultarAccionesSchema,
  validarTransicionSchema,
} from '../dto/flujo.dto';

const router = Router();
const controller = new FlujoController();

router.use(authenticate);
router.use(requirePasswordChange);

// ═══════════════════════════════════════════════════════════════════════
// CONSULTAS DE CONTEXTO (van primero para no chocar con /:id)
// ═══════════════════════════════════════════════════════════════════════

router.get(
  '/codigo/:codigo/acciones-disponibles',
  requirePermission('FLUJO_VER', 'REQUERIMIENTOS_VER'),
  validate(consultarAccionesSchema, 'query'),
  controller.listarAccionesDisponibles
);

router.post(
  '/codigo/:codigo/validar-transicion',
  requirePermission('FLUJO_VER', 'REQUERIMIENTOS_REVISAR', 'REQUERIMIENTOS_DERIVAR'),
  validate(validarTransicionSchema),
  controller.validarTransicion
);

router.get(
  '/codigo/:codigo',
  requirePermission('FLUJO_VER'),
  controller.obtenerFlujoPorCodigo
);

// ═══════════════════════════════════════════════════════════════════════
// FLUJOS
// ═══════════════════════════════════════════════════════════════════════

router.get(
  '/',
  requirePermission('FLUJO_VER'),
  validate(listarFlujosSchema, 'query'),
  controller.listarFlujos
);

router.get(
  '/:id',
  requirePermission('FLUJO_VER'),
  controller.obtenerFlujoPorId
);

router.post(
  '/',
  requirePermission('FLUJO_CREAR'),
  validate(crearFlujoSchema),
  controller.crearFlujo
);

router.put(
  '/:id',
  requirePermission('FLUJO_EDITAR'),
  validate(actualizarFlujoSchema),
  controller.actualizarFlujo
);

router.patch(
  '/:id/estado',
  requirePermission('FLUJO_INACTIVAR'),
  validate(cambiarEstadoFlujoSchema),
  controller.cambiarEstadoFlujo
);

// ═══════════════════════════════════════════════════════════════════════
// TRANSICIONES
// ═══════════════════════════════════════════════════════════════════════

router.get(
  '/:flujoId/transiciones',
  requirePermission('FLUJO_VER'),
  validate(listarTransicionesSchema, 'query'),
  controller.listarTransiciones
);

router.post(
  '/:flujoId/transiciones',
  requirePermission('FLUJO_CREAR', 'FLUJO_EDITAR'),
  validate(crearTransicionSchema),
  controller.crearTransicion
);

router.put(
  '/transiciones/:transicionId',
  requirePermission('FLUJO_EDITAR'),
  validate(actualizarTransicionSchema),
  controller.actualizarTransicion
);

router.patch(
  '/transiciones/:transicionId/estado',
  requirePermission('FLUJO_INACTIVAR'),
  validate(cambiarEstadoTransicionSchema),
  controller.cambiarEstadoTransicion
);

export default router;