import { query } from '../../../config/database';
import { env } from '../../../config/env';

export interface CatalogoCabeceraRow {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fecha_creacion: Date;
}

export interface CatalogoDetalleRow {
  id: number;
  catalogo_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  valor: string | null;
  orden: number;
  estado: string;
}

export class CatalogoRepository {
  private schema = env.db.schema;

  async listar(params: {
    page: number;
    limit: number;
    search?: string;
    soloActivos: boolean;
  }) {
    const { page, limit, search, soloActivos } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (soloActivos) conditions.push(`estado = 'ACT'`);
    if (search) {
      conditions.push(`(codigo ILIKE $${idx} OR nombre ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.catalogos ${where}`,
      values
    );

    values.push(limit, offset);
    const data = await query(
      `SELECT c.id, c.codigo, c.nombre, c.descripcion, c.estado,
              c.fecha_creacion,
              (SELECT COUNT(*)::int FROM ${this.schema}.catalogo_detalle d
                WHERE d.catalogo_id = c.id AND d.estado = 'ACT') AS total_detalles
         FROM ${this.schema}.catalogos c
         ${where}
        ORDER BY c.nombre
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return {
      data: data.rows,
      total: parseInt(count.rows[0].total, 10),
      page,
      limit,
    };
  }

  async obtenerPorId(id: number, incluirDetalles = true) {
    const cab = await query<CatalogoCabeceraRow>(
      `SELECT id, codigo, nombre, descripcion, estado, fecha_creacion
         FROM ${this.schema}.catalogos WHERE id = $1`,
      [id]
    );
    if (cab.rows.length === 0) return null;

    if (!incluirDetalles) return cab.rows[0];

    const detalles = await query<CatalogoDetalleRow>(
      `SELECT id, catalogo_id, codigo, nombre, descripcion, valor, orden, estado
         FROM ${this.schema}.catalogo_detalle
        WHERE catalogo_id = $1
        ORDER BY orden, nombre`,
      [id]
    );

    return { ...cab.rows[0], detalles: detalles.rows };
  }

  async obtenerPorCodigo(codigo: string) {
    const cab = await query<{ id: number }>(
      `SELECT id FROM ${this.schema}.catalogos WHERE codigo = $1 AND estado = 'ACT'`,
      [codigo]
    );
    if (cab.rows.length === 0) return null;

    const detalles = await query(
      `SELECT codigo, nombre, valor, orden
         FROM ${this.schema}.catalogo_detalle
        WHERE catalogo_id = $1 AND estado = 'ACT'
        ORDER BY orden`,
      [cab.rows[0].id]
    );

    return detalles.rows;
  }

  async crear(
    data: { codigo: string; nombre: string; descripcion: string | null },
    usuarioCreacion: string
  ) {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.catalogos (codigo, nombre, descripcion, usuario_creacion)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.codigo, data.nombre, data.descripcion, usuarioCreacion]
    );
    return result.rows[0].id;
  }

  async actualizar(
    id: number,
    data: { nombre?: string; descripcion?: string | null },
    usuarioModificacion: string
  ) {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.catalogos SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(id: number, estado: string, usuarioModificacion: string) {
    await query(
      `UPDATE ${this.schema}.catalogos
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }

  async crearDetalle(
    catalogoId: number,
    data: {
      codigo: string;
      nombre: string;
      descripcion: string | null;
      valor: string | null;
      orden: number;
    },
    usuarioCreacion: string
  ) {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.catalogo_detalle
         (catalogo_id, codigo, nombre, descripcion, valor, orden, usuario_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        catalogoId,
        data.codigo,
        data.nombre,
        data.descripcion,
        data.valor,
        data.orden,
        usuarioCreacion,
      ]
    );
    return result.rows[0].id;
  }

  async actualizarDetalle(
    detalleId: number,
    data: {
      nombre?: string;
      descripcion?: string | null;
      valor?: string | null;
      orden?: number;
    },
    usuarioModificacion: string
  ) {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.valor !== undefined) {
      sets.push(`valor = $${idx++}`);
      values.push(data.valor);
    }
    if (data.orden !== undefined) {
      sets.push(`orden = $${idx++}`);
      values.push(data.orden);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(detalleId);

    await query(
      `UPDATE ${this.schema}.catalogo_detalle SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstadoDetalle(detalleId: number, estado: string, usuarioModificacion: string) {
    await query(
      `UPDATE ${this.schema}.catalogo_detalle
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, detalleId]
    );
  }
}