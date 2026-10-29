import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../../../shared/middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.use(authenticate);
router.get('/stats', controller.obtenerStats);

export default router;