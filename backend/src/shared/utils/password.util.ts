import bcrypt from 'bcrypt';
import { env } from '../../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.security.bcryptSaltRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Genera una contraseña temporal segura para reset por administrador.
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += specials.charAt(Math.floor(Math.random() * specials.length));
  return password;
}