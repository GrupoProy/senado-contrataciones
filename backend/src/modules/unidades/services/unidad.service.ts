import { UnidadRepository , UnidadNodo } from '../repositories/unidad.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { CrearUnidadDto, ActualizarUnidadDto } from '../dto/unidad.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class UnidadService {
  private repository = new UnidadRepository();
  private schema = env.db.schema;

  async listar(soloActivas = false) {
    return this.repository.listar(soloActivas);
  }

  async listarComoArbol(): Promise<UnidadNodo[]> {
  return this.repository.listarComoArbol();
}

  async obtenerPorId(id: number) {
    const u = await this.repository.obtenerPorId(id);
    if (!u) throw new NotFoundError('Unidad organizacional no encontrada');
    return u;
  }

  async crear(dto: CrearUnidadDto, usuarioCreacion: string) {
    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.unidad_organizacional WHERE codigo = $1`,
      [dto.codigo]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError(`Ya existe una unidad con código '${dto.codigo}'`);
    }

    if (dto.unidadPadreId) {
      const padre = await this.repository.obtenerPorId(dto.unidadPadreId);
      if (!padre) throw new ValidationError('La unidad padre indicada no existe');
    }

    const id = await this.repository.crear(
      {
        codigo: dto.codigo,
        nombre: dto.nombre,
        sigla: dto.sigla ?? null,
        descripcion: dto.descripcion ?? null,
        unidadPadreId: dto.unidadPadreId ?? null,
      },
      usuarioCreacion
    );
    return { id, ...dto };
  }

  async actualizar(id: number, dto: ActualizarUnidadDto, usuarioModificacion: string) {
    const u = await this.repository.obtenerPorId(id);
    if (!u) throw new NotFoundError('Unidad organizacional no encontrada');

    if (dto.unidadPadreId !== undefined && dto.unidadPadreId !== null) {
      if (dto.unidadPadreId === id) {
        throw new ValidationError('Una unidad no puede ser su propio padre');
      }
      const padre = await this.repository.obtenerPorId(dto.unidadPadreId);
      if (!padre) throw new ValidationError('La unidad padre indicada no existe');
    }

    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Unidad actualizada exitosamente' };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
  const u = await this.repository.obtenerPorId(id);
  if (!u) throw new NotFoundError('Unidad organizacional no encontrada');

  if (estado === 'INA') {
    const usuarios = await this.repository.contarUsuariosActivos(id);
    if (usuarios > 0) {
      throw new ValidationError(
        'No se puede inactivar: hay usuarios activos asignados a esta unidad'
      );
    }

    const hijas = await this.repository.contarHijosActivos(id);
    if (hijas > 0) {
      throw new ValidationError(
        'No se puede inactivar: la unidad tiene subunidades activas'
      );
    }
  }

  await this.repository.cambiarEstado(id, estado, usuarioModificacion);
  return { message: `Unidad ${estado === 'ACT' ? 'activada' : 'inactivada'}` };
}
}