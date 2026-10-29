import { Router } from 'express';
import { UnidadController } from '../controllers/unidad.controller';
import { authenticate, requirePasswordChange } from '../../../shared/middlewares/auth.middleware';
import { requirePermission } from '../../../shared/middlewares/permission.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { crearUnidadSchema, actualizarUnidadSchema, cambiarEstadoSchema } from '../dto/unidad.dto';

const router = Router();
const controller = new UnidadController();

router.use(authenticate);
router.use(requirePasswordChange);

router.get('/', requirePermission('UNIDADES_VER'), controller.listar);
router.get('/arbol', requirePermission('UNIDADES_VER'), controller.arbol);
router.get('/:id', requirePermission('UNIDADES_VER'), controller.obtenerPorId);
router.post('/', requirePermission('UNIDADES_CREAR'), validate(crearUnidadSchema), controller.crear);
router.put('/:id', requirePermission('UNIDADES_EDITAR'), validate(actualizarUnidadSchema), controller.actualizar);
router.patch('/:id/estado', requirePermission('UNIDADES_INACTIVAR'), validate(cambiarEstadoSchema), controller.cambiarEstado);

export default router;