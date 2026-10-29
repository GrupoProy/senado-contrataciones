import { SenadorRepository } from '../repositories/senador.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../../shared/errors/AppError';
import type { ListarSenadoresDto, CrearSenadorDto, ActualizarSenadorDto } from '../dto/senador.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class SenadorService {
  private repository = new SenadorRepository();
  private schema = env.db.schema;

  async listar(dto: ListarSenadoresDto) { return this.repository.listar(dto); }

  async obtenerPorId(id: number) {
    const senador = await this.repository.obtenerPorId(id);
    if (!senador) throw new NotFoundError('Senador no encontrado');
    return senador;
  }

  async crear(dto: CrearSenadorDto, usuarioId: number) {
    if (dto.numeroDocumento) {
      const existe = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.senador WHERE numero_documento = $1`,
        [dto.numeroDocumento]
      );
      if (parseInt(existe.rows[0].count, 10) > 0) {
        throw new ConflictError('Ya existe un senador con ese número de documento');
      }
    }
    const id = await this.repository.crear(dto, usuarioId);
    return { id, ...dto };
  }

  async actualizar(id: number, dto: ActualizarSenadorDto, usuarioId: number) {
    await this.obtenerPorId(id);
    if (dto.numeroDocumento) {
      const existe = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.senador WHERE numero_documento = $1 AND id <> $2`,
        [dto.numeroDocumento, id]
      );
      if (parseInt(existe.rows[0].count, 10) > 0) {
        throw new ConflictError('Ya existe otro senador con ese número de documento');
      }
    }
    await this.repository.actualizar(id, dto, usuarioId);
    return { message: 'Senador actualizado exitosamente' };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioId: number) {
    await this.obtenerPorId(id);
    await this.repository.cambiarEstado(id, estado, usuarioId);
    return { message: `Senador ${estado === 'ACT' ? 'activado' : 'inactivado'} exitosamente` };
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);
    try {
      await this.repository.eliminar(id);
      return { message: 'Senador eliminado permanentemente' };
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ValidationError('No se puede eliminar el senador porque tiene requerimientos asociados. Cámbielo a inactivo.');
      }
      throw error;
    }
  }
}