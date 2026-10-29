import { Router } from 'express';
import { AuditoriaController } from '../controllers/auditoria.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { listarAuditoriaSchema } from '../dto/auditoria.dto';

const router = Router();
const controller = new AuditoriaController();

router.use(authenticate);
router.use(requirePasswordChange);

router.get(
  '/',
  requirePermission('AUDITORIA_VER'),
  validate(listarAuditoriaSchema, 'query'),
  controller.listar
);

export default router;