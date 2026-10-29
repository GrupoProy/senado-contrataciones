import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';

interface PgError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  severity?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

function isPgError(err: unknown): err is PgError {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('code' in err || 'detail' in err || 'hint' in err)
  );
}

const PG_ERROR_MESSAGES: Record<string, { status: number; mensaje: string }> = {
  '28P01': { status: 503, mensaje: 'Error de autenticación con la base de datos.' },
  '28000': { status: 503, mensaje: 'Cuenta de base de datos inválida.' },
  '3D000': { status: 503, mensaje: 'Base de datos no disponible.' },
  '42P01': { status: 500, mensaje: 'Error interno: recurso de datos no encontrado.' },
  '42501': { status: 500, mensaje: 'Permisos insuficientes en la base de datos.' },
  '53300': { status: 503, mensaje: 'Servidor de base de datos saturado. Intente más tarde.' },
  '23505': { status: 409, mensaje: 'El registro ya existe (violación de unicidad).' },
  '23503': { status: 409, mensaje: 'Referencia inválida a otro registro (clave foránea).' },
  '23514': { status: 400, mensaje: 'Datos no cumplen una restricción de la base de datos.' },
};

export function errorHandler(
  err: Error | PgError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (isPgError(err) && err.code && PG_ERROR_MESSAGES[err.code]) {
    const mapped = PG_ERROR_MESSAGES[err.code];

    // ✅ AHORA IMPRIMIMOS EL CONSTRAINT EN LA CONSOLA DEL BACKEND
    console.error(`❌ Error PostgreSQL [${err.code}]: ${err.message}`);
    if (err.detail) console.error(`   Detalle: ${err.detail}`);
    if (err.constraint) console.error(`   Constraint: ${err.constraint}`);

    res.status(mapped.status).json({
      success: false,
      error: {
        code: `PG_${err.code}`,
        message: mapped.mensaje,
        details: {
          constraint: err.constraint,
          detail: err.detail,
        }
      },
    });
    return;
  }

  if (isPgError(err) && !err.code) {
    console.error('❌ Error de red hacia PostgreSQL:', err.message);
    res.status(503).json({
      success: false,
      error: {
        code: 'DB_UNAVAILABLE',
        message: 'Servicio de base de datos no disponible.',
      },
    });
    return;
  }

  console.error('❌ Error no controlado:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.nodeEnv === 'production'
          ? 'Error interno del servidor'
          : err.message,
    },
  });
}