import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload } from '../middlewares/auth.middleware';

/**
 * Genera un access token con vigencia en minutos.
 * La vigencia proviene de parametro_sistema.AUTH_ACCESS_TOKEN_MINUTES.
 */
export function generateAccessToken(
  payload: JwtPayload,
  vigenciaMinutos: number
): string {
  const options: SignOptions = {
    expiresIn: `${vigenciaMinutos}m` as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Genera un refresh token con vigencia en días.
 * La vigencia proviene de parametro_sistema.AUTH_REFRESH_TOKEN_DAYS.
 */
export function generateRefreshToken(
  usuarioId: number,
  vigenciaDias: number
): string {
  const options: SignOptions = {
    expiresIn: `${vigenciaDias}d` as SignOptions['expiresIn'],
  };
  return jwt.sign({ usuarioId, type: 'refresh' }, env.jwt.secret, options);
}

export function verifyRefreshToken(token: string): { usuarioId: number } {
  const decoded = jwt.verify(token, env.jwt.secret) as {
    usuarioId: number;
    type: string;
  };
  if (decoded.type !== 'refresh') {
    throw new Error('Token no es de tipo refresh');
  }
  return { usuarioId: decoded.usuarioId };
}