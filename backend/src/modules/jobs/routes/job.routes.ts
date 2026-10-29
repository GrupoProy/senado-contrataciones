import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';

const router = Router();
const controller = new JobController();

router.use(authenticate);
router.use(requirePasswordChange);

router.post(
  '/vencimiento-contratos/ejecutar',
  requirePermission('PARAMETROS_EDITAR'),
  controller.ejecutarVencimientoContratos
);
router.get(
  '/ejecuciones',
  requirePermission('AUDITORIA_VER'),
  controller.listarEjecuciones
);

export default router;