import { query } from '../../../config/database';
import { env } from '../../../config/env';

// ─────────────────────────────────────────────────────────────────────────
// Tipos exportados
// ─────────────────────────────────────────────────────────────────────────

export interface UnidadRow {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  descripcion: string | null;
  unidad_padre_id: number | null;
  estado: string;
  fecha_creacion: Date;
}

export interface UnidadConPadreRow extends UnidadRow {
  padre_nombre: string | null;
}

export interface UnidadBasicaRow {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  descripcion: string | null;
  unidad_padre_id: number | null;
  estado: string;
}

export interface UnidadNodo {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  descripcion: string | null;
  unidad_padre_id: number | null;
  estado: string;
  hijos: UnidadNodo[];
}

// ─────────────────────────────────────────────────────────────────────────
// Repositorio
// ─────────────────────────────────────────────────────────────────────────

export class UnidadRepository {
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // LISTADOS
  // ═══════════════════════════════════════════════════════════════════════

  async listar(soloActivas = false): Promise<UnidadConPadreRow[]> {
    const where = soloActivas ? `WHERE u.estado = 'ACT'` : '';
    const result = await query<UnidadConPadreRow>(
      `SELECT u.id, u.codigo, u.nombre, u.sigla, u.descripcion,
              u.unidad_padre_id, u.estado, u.fecha_creacion,
              p.nombre AS padre_nombre
         FROM ${this.schema}.unidad_organizacional u
         LEFT JOIN ${this.schema}.unidad_organizacional p
                ON p.id = u.unidad_padre_id
         ${where}
        ORDER BY u.nombre`
    );
    return result.rows;
  }

  async listarComoArbol(): Promise<UnidadNodo[]> {
    const result = await query<UnidadBasicaRow>(
      `SELECT id, codigo, nombre, sigla, descripcion, unidad_padre_id, estado
         FROM ${this.schema}.unidad_organizacional
        WHERE estado = 'ACT'
        ORDER BY nombre`
    );

    const nodos: UnidadNodo[] = result.rows.map((r) => ({
      ...r,
      hijos: [],
    }));

    const map = new Map<number, UnidadNodo>();
    nodos.forEach((n) => map.set(n.id, n));

    const arbol: UnidadNodo[] = [];
    map.forEach((n) => {
      if (n.unidad_padre_id) {
        const padre = map.get(n.unidad_padre_id);
        if (padre) padre.hijos.push(n);
      } else {
        arbol.push(n);
      }
    });

    return arbol;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS PUNTUALES
  // ═══════════════════════════════════════════════════════════════════════

  async obtenerPorId(id: number): Promise<UnidadBasicaRow | null> {
    const result = await query<UnidadBasicaRow>(
      `SELECT id, codigo, nombre, sigla, descripcion, unidad_padre_id, estado
         FROM ${this.schema}.unidad_organizacional
        WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async obtenerPorCodigo(codigo: string): Promise<UnidadBasicaRow | null> {
    const result = await query<UnidadBasicaRow>(
      `SELECT id, codigo, nombre, sigla, descripcion, unidad_padre_id, estado
         FROM ${this.schema}.unidad_organizacional
        WHERE codigo = $1`,
      [codigo.toUpperCase()]
    );
    return result.rows[0] ?? null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ESCRITURA
  // ═══════════════════════════════════════════════════════════════════════

  async crear(
    data: {
      codigo: string;
      nombre: string;
      sigla: string | null;
      descripcion: string | null;
      unidadPadreId: number | null;
    },
    usuarioCreacion: string
  ): Promise<number> {
    const result = await query<{ id: number }>(
      `INSERT INTO ${this.schema}.unidad_organizacional
         (codigo, nombre, sigla, descripcion, unidad_padre_id, estado, usuario_creacion)
       VALUES ($1, $2, $3, $4, $5, 'ACT', $6)
       RETURNING id`,
      [
        data.codigo,
        data.nombre,
        data.sigla,
        data.descripcion,
        data.unidadPadreId,
        usuarioCreacion,
      ]
    );
    return result.rows[0].id;
  }

  async actualizar(
    id: number,
    data: {
      nombre?: string;
      sigla?: string | null;
      descripcion?: string | null;
      unidadPadreId?: number | null;
    },
    usuarioModificacion: string
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.sigla !== undefined) {
      sets.push(`sigla = $${idx++}`);
      values.push(data.sigla);
    }
    if (data.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.unidadPadreId !== undefined) {
      sets.push(`unidad_padre_id = $${idx++}`);
      values.push(data.unidadPadreId);
    }
    if (sets.length === 0) return;

    sets.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    sets.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.unidad_organizacional
          SET ${sets.join(', ')}
        WHERE id = $${idx}`,
      values
    );
  }

  async cambiarEstado(
    id: number,
    estado: string,
    usuarioModificacion: string
  ): Promise<void> {
    await query(
      `UPDATE ${this.schema}.unidad_organizacional
          SET estado = $1,
              usuario_ultima_modificacion = $2,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $3`,
      [estado, usuarioModificacion, id]
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONTADORES PARA VALIDACIONES DE INACTIVACIÓN
  // ═══════════════════════════════════════════════════════════════════════

  async contarUsuariosActivos(unidadId: number): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.usuario
        WHERE unidad_organizacional_id = $1
          AND estado = 'ACT'`,
      [unidadId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async contarHijosActivos(unidadId: number): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.unidad_organizacional
        WHERE unidad_padre_id = $1
          AND estado = 'ACT'`,
      [unidadId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}