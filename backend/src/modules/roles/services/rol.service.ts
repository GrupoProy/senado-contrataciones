import { RolRepository, RolRow } from '../repositories/rol.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { CrearRolDto, ActualizarRolDto } from '../dto/rol.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class RolService {
  private repository = new RolRepository();
  private schema = env.db.schema;

  async listar() {
    return this.repository.listar();
  }

  async obtenerPorId(id: number) {
    const rol: RolRow | null = await this.repository.obtenerPorId(id);
    if (!rol) throw new NotFoundError('Rol no encontrado');
    return rol;
  }

  async crear(dto: CrearRolDto, usuarioCreacion: string) {
    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.rol
        WHERE codigo = $1 OR nombre = $2`,
      [dto.codigo, dto.nombre]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError('Ya existe un rol con ese código o nombre');
    }

    await this.validarPermisos(dto.permisos ?? []);
    await this.validarMenus(dto.menus ?? []);

    const id = await this.repository.crear(
      { codigo: dto.codigo, nombre: dto.nombre, descripcion: dto.descripcion ?? null },
      usuarioCreacion
    );

    return {
      id,
      codigo: dto.codigo,
      nombre: dto.nombre,
      mensaje:
        'Rol creado. Use PUT /api/matriz/roles/:id/sincronizar para asignar permisos y menús.',
    };
  }

  async actualizar(id: number, dto: ActualizarRolDto, usuarioModificacion: string) {
    const rol: RolRow | null = await this.repository.obtenerPorId(id);
    if (!rol) throw new NotFoundError('Rol no encontrado');

    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Rol actualizado exitosamente' };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
    const rol: RolRow | null = await this.repository.obtenerPorId(id);
    if (!rol) throw new NotFoundError('Rol no encontrado');

    if (rol.codigo === 'ADMINISTRADOR' && estado === 'INA') {
      throw new ValidationError('El rol ADMINISTRADOR no puede ser inactivado');
    }

    if (estado === 'INA') {
      const usuariosActivos = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.usuario_rol
          WHERE rol_id = $1 AND estado = 'ACT'
            AND (fecha_hasta IS NULL OR fecha_hasta >= CURRENT_DATE)`,
        [id]
      );
      if (parseInt(usuariosActivos.rows[0].count, 10) > 0) {
        throw new ValidationError(
          `No se puede inactivar el rol: tiene ${usuariosActivos.rows[0].count} usuario(s) vigente(s) asignado(s)`
        );
      }
    }

    await this.repository.cambiarEstado(id, estado, usuarioModificacion);
    return { message: `Rol ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }

  private async validarPermisos(permisos: number[]): Promise<void> {
    if (permisos.length === 0) return;
    const placeholders = permisos.map((_, i) => `$${i + 1}`).join(',');
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.permiso
        WHERE id IN (${placeholders}) AND estado = 'ACT'`,
      permisos
    );
    if (parseInt(r.rows[0].count, 10) !== permisos.length) {
      throw new ValidationError('Alguno de los permisos indicados no existe o está inactivo');
    }
  }

  private async validarMenus(menus: number[]): Promise<void> {
    if (menus.length === 0) return;
    const placeholders = menus.map((_, i) => `$${i + 1}`).join(',');
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.menu
        WHERE id IN (${placeholders}) AND estado = 'ACT'`,
      menus
    );
    if (parseInt(r.rows[0].count, 10) !== menus.length) {
      throw new ValidationError('Alguno de los menús indicados no existe o está inactivo');
    }
  }
}