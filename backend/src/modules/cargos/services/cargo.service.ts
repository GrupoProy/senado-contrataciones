import { CargoRepository } from '../repositories/cargo.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { CrearCargoDto, ActualizarCargoDto, ListarCargosDto } from '../dto/cargo.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class CargoService {
  private repository = new CargoRepository();
  private schema = env.db.schema;

  async listar(dto: ListarCargosDto) {
    return this.repository.listar(dto);
  }

  async obtenerPorId(id: number) {
    const c = await this.repository.obtenerPorId(id);
    if (!c) throw new NotFoundError('Cargo no encontrado');
    return c;
  }

  async crear(dto: CrearCargoDto, usuarioCreacion: string) {
    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.cargo WHERE codigo = $1`,
      [dto.codigo]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError(`Ya existe un cargo con código '${dto.codigo}'`);
    }

    if (dto.unidadOrganizacionalId) {
      await this.validarUnidad(dto.unidadOrganizacionalId);
    }
    await this.validarNivel(dto.nivel);
    await this.validarClase(dto.clase);

    const id = await this.repository.crear(
      {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        nivel: dto.nivel,
        clase: dto.clase,
        salarioMes: dto.salarioMes,
        unidadOrganizacionalId: dto.unidadOrganizacionalId ?? null,
      },
      usuarioCreacion
    );
    return { id, ...dto };
  }

  async actualizar(id: number, dto: ActualizarCargoDto, usuarioModificacion: string) {
    const c = await this.repository.obtenerPorId(id);
    if (!c) throw new NotFoundError('Cargo no encontrado');

    if (dto.unidadOrganizacionalId) await this.validarUnidad(dto.unidadOrganizacionalId);
    if (dto.nivel) await this.validarNivel(dto.nivel);
    if (dto.clase) await this.validarClase(dto.clase);

    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Cargo actualizado exitosamente' };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
    const c = await this.repository.obtenerPorId(id);
    if (!c) throw new NotFoundError('Cargo no encontrado');

    if (estado === 'INA') {
      const requerimientos = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.requerimiento
          WHERE cargo_id = $1 AND estado_codigo NOT IN ('FINALIZADO','ANULADO','RECHAZADO','CONCLUIDO')`,
        [id]
      );
      if (parseInt(requerimientos.rows[0].count, 10) > 0) {
        throw new ValidationError(
          'No se puede inactivar: el cargo tiene requerimientos activos'
        );
      }
    }

    await this.repository.cambiarEstado(id, estado, usuarioModificacion);
    return { message: `Cargo ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }

  // ─── Validaciones contra catálogos (nada hardcodeado) ───────────────
  private async validarUnidad(unidadId: number): Promise<void> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.unidad_organizacional
        WHERE id = $1 AND estado = 'ACT'`,
      [unidadId]
    );
    if (parseInt(r.rows[0].count, 10) === 0) {
      throw new ValidationError('La unidad organizacional no existe o está inactiva');
    }
  }

  private async validarNivel(nivel: string): Promise<void> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.catalogo_detalle d
         JOIN ${this.schema}.catalogos c ON c.id = d.catalogo_id
        WHERE c.codigo = 'NIVEL_CARGO' AND d.codigo = $1 AND d.estado = 'ACT'`,
      [nivel]
    );
    if (parseInt(r.rows[0].count, 10) === 0) {
      throw new ValidationError(`El nivel de cargo '${nivel}' no es válido`);
    }
  }

  private async validarClase(clase: string): Promise<void> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.catalogo_detalle d
         JOIN ${this.schema}.catalogos c ON c.id = d.catalogo_id
        WHERE c.codigo = 'CLASE_CARGO' AND d.codigo = $1 AND d.estado = 'ACT'`,
      [clase]
    );
    if (parseInt(r.rows[0].count, 10) === 0) {
      throw new ValidationError(`La clase de cargo '${clase}' no es válida`);
    }
  }
}