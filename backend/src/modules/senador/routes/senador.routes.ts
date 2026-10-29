import { Router } from 'express';
import { SenadorController } from '../controllers/senador.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import {
  listarSenadoresSchema, crearSenadorSchema, actualizarSenadorSchema, cambiarEstadoSenadorSchema
} from '../dto/senador.dto';

const router = Router();
const controller = new SenadorController();

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', validate(listarSenadoresSchema, 'query'), controller.listar);
router.get('/:id', controller.obtenerPorId);

router.post('/', validate(crearSenadorSchema), controller.crear);
router.put('/:id', validate(actualizarSenadorSchema), controller.actualizar);
router.patch('/:id/estado', validate(cambiarEstadoSenadorSchema), controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

export default router;