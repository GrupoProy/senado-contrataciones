import { CatalogoRepository } from '../repositories/catalogo.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import {
  CrearCatalogoDto,
  ActualizarCatalogoDto,
  CrearDetalleDto,
  ActualizarDetalleDto,
  ListarCatalogosDto,
} from '../dto/catalogo.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class CatalogoService {
  private repository = new CatalogoRepository();
  private schema = env.db.schema;

  async listar(dto: ListarCatalogosDto) {
    return this.repository.listar(dto);
  }

  async obtenerPorId(id: number) {
    const cat = await this.repository.obtenerPorId(id, true);
    if (!cat) throw new NotFoundError('Catálogo no encontrado');
    return cat;
  }

  async obtenerPorCodigo(codigo: string) {
    const detalles = await this.repository.obtenerPorCodigo(codigo);
    if (!detalles) throw new NotFoundError(`Catálogo '${codigo}' no encontrado o inactivo`);
    return detalles;
  }

  async crear(dto: CrearCatalogoDto, usuarioCreacion: string) {
    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.catalogos WHERE codigo = $1`,
      [dto.codigo]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError(`Ya existe un catálogo con código '${dto.codigo}'`);
    }
    const id = await this.repository.crear(
      { codigo: dto.codigo, nombre: dto.nombre, descripcion: dto.descripcion ?? null },
      usuarioCreacion
    );
    return { id, ...dto };
  }

  async actualizar(id: number, dto: ActualizarCatalogoDto, usuarioModificacion: string) {
    const cat = await this.repository.obtenerPorId(id, false);
    if (!cat) throw new NotFoundError('Catálogo no encontrado');
    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Catálogo actualizado exitosamente' };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
    const cat = await this.repository.obtenerPorId(id, false);
    if (!cat) throw new NotFoundError('Catálogo no encontrado');

    // Verificar que ningún detalle activo impida inactivar (opcional)
    if (estado === 'INA') {
      const detallesActivos = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.catalogo_detalle
          WHERE catalogo_id = $1 AND estado = 'ACT'`,
        [id]
      );
      if (parseInt(detallesActivos.rows[0].count, 10) > 0) {
        throw new ValidationError(
          'No se puede inactivar un catálogo con detalles activos. Inactive primero los detalles.'
        );
      }
    }

    await this.repository.cambiarEstado(id, estado, usuarioModificacion);
    return { message: `Catálogo ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }

  // ─── Detalles ───────────────────────────────────────────────────────

  async crearDetalle(
    catalogoId: number,
    dto: CrearDetalleDto,
    usuarioCreacion: string
  ) {
    const cat = await this.repository.obtenerPorId(catalogoId, false);
    if (!cat) throw new NotFoundError('Catálogo no encontrado');

    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.catalogo_detalle
        WHERE catalogo_id = $1 AND codigo = $2`,
      [catalogoId, dto.codigo]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError(`Ya existe un detalle con código '${dto.codigo}' en este catálogo`);
    }

    const id = await this.repository.crearDetalle(
      catalogoId,
      {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        valor: dto.valor ?? null,
        orden: dto.orden,
      },
      usuarioCreacion
    );
    return { id, ...dto };
  }

  async actualizarDetalle(
    detalleId: number,
    dto: ActualizarDetalleDto,
    usuarioModificacion: string
  ) {
    await this.repository.actualizarDetalle(detalleId, dto, usuarioModificacion);
    return { message: 'Detalle actualizado exitosamente' };
  }

  async cambiarEstadoDetalle(
    detalleId: number,
    estado: 'ACT' | 'INA',
    usuarioModificacion: string
  ) {
    await this.repository.cambiarEstadoDetalle(detalleId, estado, usuarioModificacion);
    return { message: `Detalle ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }
}