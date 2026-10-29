import { PermisoRepository } from '../repositories/permiso.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { CrearPermisoDto } from '../dto/permiso.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class PermisoService {
  private repository = new PermisoRepository();
  private schema = env.db.schema;

  async listar(filtros: { modulo?: string; search?: string } = {}) {
    return this.repository.listar(filtros);
  }

  async agrupados() {
    return this.repository.agrupadosPorModulo();
  }

  async obtenerPorId(id: number) {
    const p = await this.repository.obtenerPorId(id);
    if (!p) throw new NotFoundError('Permiso no encontrado');
    return p;
  }

  async crear(dto: CrearPermisoDto, usuarioCreacion: string) {
    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.permiso WHERE clave = $1`,
      [dto.clave]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError(`Ya existe un permiso con clave '${dto.clave}'`);
    }

    const id = await this.repository.crear(
      {
        clave: dto.clave,
        modulo: dto.modulo,
        accion: dto.accion,
        descripcion: dto.descripcion ?? null,
      },
      usuarioCreacion
    );
    return { id, ...dto };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
    const p = await this.repository.obtenerPorId(id);
    if (!p) throw new NotFoundError('Permiso no encontrado');

    if (estado === 'INA') {
      const rolesActivos = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.rol_permiso rp
          JOIN ${this.schema}.rol r ON r.id = rp.rol_id AND r.estado = 'ACT'
         WHERE rp.permiso_id = $1 AND rp.estado = 'ACT'`,
        [id]
      );
      if (parseInt(rolesActivos.rows[0].count, 10) > 0) {
        throw new ValidationError(
          `No se puede inactivar: ${rolesActivos.rows[0].count} rol(es) activo(s) usan este permiso`
        );
      }
    }

    await this.repository.cambiarEstado(id, estado, usuarioModificacion);
    return { message: `Permiso ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }
}