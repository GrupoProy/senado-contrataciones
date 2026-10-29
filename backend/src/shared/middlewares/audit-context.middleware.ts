import { Request, Response, NextFunction } from 'express';
import { auditStorage } from '../../config/audit-context';

/**
 * Envuelve el ciclo de vida del request en un AsyncLocalStorage con el
 * contexto de auditoría. Debe ir DESPUÉS de `authenticate` para tener
 * `req.user` disponible, y ANTES de cualquier middleware/servicio que
 * consulte la BD.
 */
export function auditContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const ctx = {
    username: req.user?.username ?? 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
  auditStorage.run(ctx, () => next());
}