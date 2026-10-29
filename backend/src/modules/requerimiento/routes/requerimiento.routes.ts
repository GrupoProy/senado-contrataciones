import { Router } from 'express';
import { RequerimientoController } from '../controllers/requerimiento.controller';
import {
  authenticate,
  requirePasswordChange,
} from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  crearRequerimientoSchema,
  actualizarRequerimientoSchema,
  listarRequerimientosSchema,
  derivarDesdeRequerimientoSchema,
  derivarMasivoDesdeRequerimientoSchema,
} from '../dto/requerimiento.dto';

const router = Router();
const controller = new RequerimientoController();

router.use(authenticate);
router.use(requirePasswordChange);

// ═══════════════════════════════════════════════════════════════════════
// RUTAS ESPECÍFICAS (antes de /:id)
// ═══════════════════════════════════════════════════════════════════════

router.get(
  '/persona/buscar',
  requirePermission('REQUERIMIENTOS_CREAR', 'REQUERIMIENTOS_VER', 'PERSONAS_VER'),
  controller.buscarPersona
);

router.get(
  '/persona/:personaId/activo',
  requirePermission(
    'REQUERIMIENTOS_VER',
    'REQUERIMIENTOS_CREAR',
    'PERSONAS_VER'
  ),
  controller.obtenerProcesoActivo
);
router.get(
  '/stats',
  requirePermission('REQUERIMIENTOS_VER'),
  controller.obtenerEstadisticas
);
router.get(
  '/bandeja',
  requirePermission('REQUERIMIENTOS_VER'),
  controller.bandeja
);

router.get(
  '/bandeja-derivar',
  requirePermission('REQUERIMIENTOS_VER', 'REQUERIMIENTOS_DERIVAR'),
  controller.bandejaDerivar
);

router.post(
  '/derivar-masivo',
  requirePermission('REQUERIMIENTOS_DERIVAR'),
  validate(derivarMasivoDesdeRequerimientoSchema),
  controller.derivarMasivo
);

// ═══════════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════════

router.get(
  '/',
  requirePermission('REQUERIMIENTOS_VER'),
  validate(listarRequerimientosSchema, 'query'),
  controller.listar
);

router.post(
  '/',
  requirePermission('REQUERIMIENTOS_CREAR'),
  validate(crearRequerimientoSchema),
  controller.crear
);

router.get(
  '/:id',
  requirePermission('REQUERIMIENTOS_VER'),
  controller.obtenerPorId
);

router.put(
  '/:id',
  requirePermission('REQUERIMIENTOS_EDITAR'),
  validate(actualizarRequerimientoSchema),
  controller.actualizar
);

router.post(
  '/:id/derivar',
  requirePermission('REQUERIMIENTOS_DERIVAR'),
  validate(derivarDesdeRequerimientoSchema),
  controller.derivar
);



export default router;