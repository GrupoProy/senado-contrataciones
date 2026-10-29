import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

type Source = 'body' | 'query' | 'params';

/**
 * Valida el payload de una petición contra un schema Zod.
 *
 * IMPORTANTE (Express 5): `req.query` y `req.params` son getters de solo
 * lectura. Para sobrescribirlos con los datos validados usamos
 * Object.defineProperty; para `body` (writable) basta la asignación directa.
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);

      if (source === 'body') {
        req.body = data;
      } else {
        Object.defineProperty(req, source, {
          value: data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        }));
        return next(new ValidationError('Datos de entrada inválidos', details));
      }
      next(error);
    }
  };
}