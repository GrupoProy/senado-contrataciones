import { Router } from 'express';
import { SeguimientoController } from '../controllers/seguimiento.controller';
import {
  authenticate,
  requirePasswordChange,
} from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  derivarSchema,
  derivarMasivoSchema,
  recibirSchema,
  iniciarRevisionSchema,
  concluirRevisionSchema,
  elaborarContratoSchema,
  enviarFirmaSchema,
  registrarFirmaSchema,
  observarSchema,
  subsanarSchema,
  aprobarSchema,
  finalizarSchema,
  rechazarSchema,
  noSubsanadoSchema, recibirMasivoSchema ,
} from '../dto/seguimiento.dto';

const router = Router();
const controller = new SeguimientoController();

router.use(authenticate);
router.use(requirePasswordChange);

// ═══════════════════════════════════════════════════════════════════════
// CONSULTAS (antes de /:id)
// ═══════════════════════════════════════════════════════════════════════
router.get('/stats', requirePermission('SEGUIMIENTO_VER'), controller.obtenerEstadisticas);
router.get('/bandeja', requirePermission('SEGUIMIENTO_VER'), controller.bandeja);

router.get(
  '/derivables',
  requirePermission('REQUERIMIENTOS_DERIVAR', 'SEGUIMIENTO_VER'),
  controller.listarDerivables
);

router.get(
  '/requerimiento/:requerimientoId',
  requirePermission('SEGUIMIENTO_VER'),
  controller.historial
);

router.get('/checklist/:requerimientoId', requirePermission('REQUERIMIENTOS_REVISAR'), controller.obtenerChecklist);
router.post('/checklist/:requerimientoId', requirePermission('REQUERIMIENTOS_REVISAR'), controller.guardarChecklist);

router.get('/:id', requirePermission('SEGUIMIENTO_VER'), controller.obtenerPorId);

// ═══════════════════════════════════════════════════════════════════════
// DERIVACIÓN POSTERIOR
// ═══════════════════════════════════════════════════════════════════════

router.post(
  '/derivar',
  requirePermission('REQUERIMIENTOS_DERIVAR'),
  validate(derivarSchema),
  controller.derivarPosterior
);

router.post(
  '/derivar-masivo',
  requirePermission('REQUERIMIENTOS_DERIVAR'),
  validate(derivarMasivoSchema),
  controller.derivarMasivoPosterior
);

// ═══════════════════════════════════════════════════════════════════════
// ACCIONES DEL FLUJO
// ═══════════════════════════════════════════════════════════════════════

router.post(
  '/recibir',
  requirePermission('REQUERIMIENTOS_RECIBIR'),
  validate(recibirSchema),
  controller.recibir
);

router.post(
  '/iniciar-revision',
  requirePermission('REQUERIMIENTOS_REVISAR'),
  validate(iniciarRevisionSchema),
  controller.iniciarRevision
);

router.post(
  '/concluir-revision',
  requirePermission('REQUERIMIENTOS_REVISAR'),
  validate(concluirRevisionSchema),
  controller.concluirRevision
);

router.post(
  '/elaborar-contrato',
  requirePermission('REQUERIMIENTOS_REVISAR', 'CONTRATOS_CREAR'),
  validate(elaborarContratoSchema),
  controller.elaborarContrato
);

router.post(
  '/enviar-firma',
  requirePermission('REQUERIMIENTOS_REVISAR', 'CONTRATOS_EDITAR'),
  validate(enviarFirmaSchema),
  controller.enviarFirma
);

router.post(
  '/registrar-firma',
  requirePermission('REQUERIMIENTOS_REVISAR', 'CONTRATOS_EDITAR'),
  validate(registrarFirmaSchema),
  controller.registrarFirma
);

router.post(
  '/observar',
  requirePermission('REQUERIMIENTOS_OBSERVAR'),
  validate(observarSchema),
  controller.observar
);

router.post(
  '/subsanar',
  requirePermission('REQUERIMIENTOS_SUBSANAR'),
  validate(subsanarSchema),
  controller.subsanar
);

router.post(
  '/aprobar',
  requirePermission('REQUERIMIENTOS_REVISAR'),
  validate(aprobarSchema),
  controller.aprobar
);

router.post(
  '/finalizar',
  requirePermission('REQUERIMIENTOS_FINALIZAR'),
  validate(finalizarSchema),
  controller.finalizar
);

router.post(
  '/rechazar',
  requirePermission('REQUERIMIENTOS_ANULAR', 'REQUERIMIENTOS_OBSERVAR'),
  validate(rechazarSchema),
  controller.rechazar
);

router.post(
  '/no-subsanado',
  requirePermission('REQUERIMIENTOS_FINALIZAR', 'REQUERIMIENTOS_ANULAR'),
  validate(noSubsanadoSchema),
  controller.noSubsanado
);

router.post('/recibir-masivo', requirePermission('REQUERIMIENTOS_RECIBIR'), validate(recibirMasivoSchema), controller.recibirMasivo);

export default router;