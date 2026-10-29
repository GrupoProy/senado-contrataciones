import { Router } from 'express';
import { PersonaController } from '../controllers/persona.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { crearPersonaSchema, actualizarPersonaSchema } from '../dto/persona.dto';

const router = Router();
const controller = new PersonaController();

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('PERSONAS_VER'), controller.listar);
router.get('/:id', requirePermission('PERSONAS_VER'), controller.obtenerPorId);
router.post('/', requirePermission('PERSONAS_CREAR'), validate(crearPersonaSchema), controller.crear);
router.put('/:id', requirePermission('PERSONAS_EDITAR'), validate(actualizarPersonaSchema), controller.actualizar);
router.delete('/:id', requirePermission('PERSONAS_INACTIVAR'), controller.eliminar);

export default router;