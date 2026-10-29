import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';

export interface JwtPayload {
  usuarioId: number;
  username: string;
  unidadId: number | null;
  debeCambiarPassword: boolean;
  rolId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso no proporcionado'));
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
}

export function requirePasswordChange(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.debeCambiarPassword) {
    return next(
      new ForbiddenError(
        'Debe cambiar su contraseña antes de continuar. Use /api/auth/cambiar-password'
      )
    );
  }
  next();
}