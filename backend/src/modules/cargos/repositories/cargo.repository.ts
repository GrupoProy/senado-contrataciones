import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class CargoRepository {
  private schema = env.db.schema;

  async listar(params: {
    page: number;
    limit: number;
    search?: string;
    unidadId?: number;
    soloActivos: boolean;
  }) {
    const { page, limit, search, unidadId, soloActivos } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (soloActivos) conditions.push(`c.estado = 'ACT'`);
    if (search) {
      conditions.push(`(c.codigo ILIKE $${idx} OR c.nombre ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }
    if (unidadId) {
      conditions.push(`c.unidad_organizacional_id = $${idx++}`);
      values.push(unidadId);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.cargo c ${where}`,
      values
    );

    values.push(limit, offset);
    const data = await query(
      `SELECT c.id, c.codigo, c.nombre, c.descripcion, c.nivel, c.clase,
              c.salario_mes, c.unidad_organizacional_id, c.estado, c.fecha_creacion,
              u.nombre AS unidad_nombre
         FROM ${this.schema}.cargo c
         LEFT JOIN ${this.schema}.unidad_organizacional u ON u.id = c.unidad_organizacional_id
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

  async obtenerPorId(id: number) {
    const result = await query(
      `SELECT c.id, c.codigo, c.nombre, c.descripcion, c.nivel, c.clase,
              c.salario_mes, c.unidad_organizacional_id, c.estado,
              u.nombre AS unidad_nombre
         FROM ${this.schema}.cargo c
         LEFT JOIN ${this.schema}.unidad_organizacional u ON u.id = c.unidad_organizacional_id
        WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async crear(
    data: {
      codigo: string;
      nombre: string;
      descripcion: string | null;
      nivel: string;
      clase: string;
      salarioMes: number;
      unidadOrganizacionalId: number | null;
    },
    usuarioCreacion: string
  ) {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.cargo
         (codigo, nombre, descripcion, nivel, clase, salario_mes,
          unidad_organizacional_id, usuario_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        data.codigo,
        data.nombre,
        data.descripcion,
        data.nivel,
        data.clase,
        data.salarioMes,
        data.unidadOrganizacionalId,
        usuarioCreacion,
      ]
    );
    return result.rows[0].id;
  }

  async actualizar(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string | null;
      nivel?: string;
      clase?: string;
      salarioMes?: number;
      unidadOrganizacionalId?: number | null;
    },
    usuarioModificacion: string
  ) {
    const mapa: Record<string, string> = {
      nombre: 'nombre',
      descripcion: 'descripcion',
      nivel: 'nivel',
      clase: 'clase',
      salarioMes: 'salario_mes',
      unidadOrganizacionalId: 'unidad_organizacional_id',
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(mapa)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push((data as Record<string, unknown>)[key]);
      }
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.cargo SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(id: number, estado: string, usuarioModificacion: string) {
    await query(
      `UPDATE ${this.schema}.cargo
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }
}