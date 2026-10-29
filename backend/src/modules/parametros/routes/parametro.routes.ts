import { Router } from 'express';
import { z } from 'zod';
import { ParametroController } from '../controllers/parametro.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';

const router = Router();
const controller = new ParametroController();

const actualizarSchema = z.object({
  valor: z.union([z.string(), z.number(), z.boolean()]).transform((v) => String(v)),
});

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('PARAMETROS_VER'), controller.listar);
router.put('/:clave', requirePermission('PARAMETROS_EDITAR'), validate(actualizarSchema), controller.actualizar);
router.post('/recargar-cache', requirePermission('PARAMETROS_EDITAR'), controller.recargarCache);

export default router;