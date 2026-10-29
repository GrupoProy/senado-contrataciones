import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './shared/middlewares/error.middleware';

import authRoutes from './modules/auth/routes/auth.routes';
import usuarioRoutes from './modules/usuarios/routes/usuario.routes';
import personaRoutes from './modules/personas/routes/persona.routes';
import rolRoutes from './modules/roles/routes/rol.routes';
import permisoRoutes from './modules/permisos/routes/permiso.routes';
import menuRoutes from './modules/menus/routes/menu.routes';
import { auditContextMiddleware } from './shared/middlewares/audit-context.middleware';
import catalogoRoutes from './modules/catalogos/routes/catalogo.routes';
import unidadRoutes from './modules/unidades/routes/unidad.routes';
import cargoRoutes from './modules/cargos/routes/cargo.routes';
import parametroRoutes from './modules/parametros/routes/parametro.routes';
import matrizRoutes from './modules/matriz/routes/matriz.routes';
import contratoRoutes from './modules/contratos/routes/contrato.routes';
import jobRoutes from './modules/jobs/routes/job.routes';
import flujoRoutes from './modules/flujo/routes/flujo.routes';
import requerimientoRoutes from './modules/requerimiento/routes/requerimiento.routes';
import seguimientoRoutes from './modules/seguimiento/routes/seguimiento.routes';
import senadorRoutes from './modules/senador/routes/senador.routes';
import auditoriaRoutes from './modules/auditoria/routes/auditoria.routes';
import dashboardRoutes from './modules/dashboard/routes/dashboard.routes';
const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(auditContextMiddleware);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes' } },
});
app.use('/api', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Demasiados intentos de login' } },
});
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/unidades', unidadRoutes);
app.use('/api/cargos', cargoRoutes);
app.use('/api/parametros', parametroRoutes);
app.use('/api/matriz', matrizRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/flujos', flujoRoutes);
app.use('/api/requerimientos', requerimientoRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/senadores', senadorRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'OK', timestamp: new Date().toISOString() } });
});

app.use(errorHandler);

export { app };