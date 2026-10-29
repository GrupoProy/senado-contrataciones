import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { env } from '../../config/env'; // ✅ Importamos la configuración
import { ForbiddenError } from '../errors/AppError';

export function requirePermission(...permisosRequeridos: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado');
    }

    const schema = env.db.schema; // ✅ Usamos la variable correcta

    // 1. El administrador tiene acceso total
    const esAdmin = await esAdministrador(req.user.usuarioId, schema);
    if (esAdmin) {
      next();
      return;
    }

    // 2. Consultar permisos del usuario
    const result = await query<{ clave: string }>(
      `SELECT DISTINCT p.clave
         FROM ${schema}.usuario_rol ur
         JOIN ${schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
         JOIN ${schema}.rol_permiso rp ON rp.rol_id = r.id AND rp.estado = 'ACT'
         JOIN ${schema}.permiso p ON p.id = rp.permiso_id AND p.estado = 'ACT'
        WHERE ur.usuario_id = $1
          AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)`,
      [req.user.usuarioId]
    );

    const permisosUsuario = result.rows.map((r) => r.clave);
    const tienePermiso = permisosRequeridos.some((p) => permisosUsuario.includes(p));

    if (!tienePermiso) {
      console.warn(`⛔ Acceso denegado a usuario ID ${req.user.usuarioId}.`);
      console.warn(`   Permisos solicitados: ${permisosRequeridos.join(', ')}`);
      console.warn(`   Permisos del usuario: [${permisosUsuario.join(', ')}]`);
      
      throw new ForbiddenError(
        `No tiene permiso para esta operación. Requerido: ${permisosRequeridos.join(' o ')}`
      );
    }

    next();
  };
}

async function esAdministrador(usuarioId: number, schema: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM ${schema}.usuario_rol ur
       JOIN ${schema}.rol r ON r.id = ur.rol_id
      WHERE ur.usuario_id = $1
        AND r.codigo = 'ADMINISTRADOR'
        AND ur.estado = 'ACT'
        AND r.estado = 'ACT'`,
    [usuarioId]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}