import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { authenticate } from '../../../shared/middlewares/auth.middleware';
import { loginSchema, cambiarPasswordSchema , refreshTokenSchema } from '../dto/auth.dto';

const router = Router();
const controller = new AuthController();

// Público
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshTokenSchema), controller.refrescarToken);

// Protegidos (requieren JWT)
router.post(
  '/cambiar-password',
  authenticate,
  validate(cambiarPasswordSchema),
  controller.cambiarPassword
);
router.post('/logout', authenticate, controller.logout);
router.get('/mi-perfil', authenticate, controller.miPerfil);

export default router;