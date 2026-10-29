import { PoolClient } from 'pg';
import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';

export class MatrizRepository {
  private schema = env.db.schema;

  async obtenerMatrizRol(rolId: number) {
    const rol = await query<{
      id: number;
      codigo: string;
      nombre: string;
      descripcion: string | null;
      estado: string;
    }>(
      `SELECT id, codigo, nombre, descripcion, estado
         FROM ${this.schema}.rol WHERE id = $1`,
      [rolId]
    );
    if (rol.rows.length === 0) return null;

    const permisos = await query<{
      id: number;
      clave: string;
      modulo: string;
      accion: string;
      descripcion: string | null;
      asignado: boolean;
    }>(
      `SELECT p.id, p.clave, p.modulo, p.accion, p.descripcion,
              EXISTS (
                SELECT 1 FROM ${this.schema}.rol_permiso rp
                 WHERE rp.rol_id = $1 AND rp.permiso_id = p.id AND rp.estado = 'ACT'
              ) AS asignado
         FROM ${this.schema}.permiso p
        WHERE p.estado = 'ACT'
        ORDER BY p.modulo, p.accion`,
      [rolId]
    );

    const menus = await query<{
      id: number;
      clave: string;
      etiqueta: string;
      ruta: string | null;
      icono: string | null;
      menu_padre_id: number | null;
      orden: number;
      asignado: boolean;
    }>(
      `SELECT m.id, m.clave, m.etiqueta, m.ruta, m.icono, m.menu_padre_id, m.orden,
              EXISTS (
                SELECT 1 FROM ${this.schema}.menu_rol mr
                 WHERE mr.rol_id = $1 AND mr.menu_id = m.id AND mr.estado = 'ACT'
              ) AS asignado
         FROM ${this.schema}.menu m
        WHERE m.estado = 'ACT'
        ORDER BY COALESCE(m.menu_padre_id, m.id), m.orden`,
      [rolId]
    );

    const usuarios = await query<{
      id: number;
      username: string;
      nombres: string;
      primer_apellido: string;
      estado: string;
      fecha_desde: string;
      fecha_hasta: string | null;
    }>(
      `SELECT u.id, u.username, u.nombres, u.primer_apellido, u.estado,
              ur.fecha_desde, ur.fecha_hasta
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.usuario u ON u.id = ur.usuario_id
        WHERE ur.rol_id = $1 AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
        ORDER BY u.nombres`,
      [rolId]
    );

    return {
      rol: rol.rows[0],
      permisos: permisos.rows,
      menus: menus.rows,
      usuarios: usuarios.rows,
    };
  }

  async sincronizar(rolId: number, permisos: number[], menus: number[], usuario: string) {
    return transaction(async (client) => {
      await this.sincronizarPermisos(client, rolId, permisos, usuario);
      await this.sincronizarMenus(client, rolId, menus, usuario);
    });
  }

  private async sincronizarPermisos(
    client: PoolClient,
    rolId: number,
    permisos: number[],
    usuario: string
  ): Promise<void> {
    // 1. Inactivar todos los permisos actuales del rol
    await client.query(
      `UPDATE ${this.schema}.rol_permiso
          SET estado = 'INA',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE rol_id = $2 AND estado = 'ACT'`,
      [usuario, rolId]
    );

    if (permisos.length === 0) return;

    // 2. Validar que los permisos enviados existan (usando $1, $2, etc.)
    const placeholders = permisos.map((_, i) => `$${i + 1}`).join(',');
    const validos = await client.query<{ id: number }>(
      `SELECT id FROM ${this.schema}.permiso
        WHERE id IN (${placeholders}) AND estado = 'ACT'`,
      permisos // Aquí pasamos SOLO los permisos, sin el rolId
    );

    // 3. Insertar o reactivar
    for (const row of validos.rows) {
      await client.query(
        `INSERT INTO ${this.schema}.rol_permiso (rol_id, permiso_id, estado, usuario_creacion)
         VALUES ($1, $2, 'ACT', $3)
         ON CONFLICT (rol_id, permiso_id)
         DO UPDATE SET estado = 'ACT',
                       usuario_ultima_modificacion = $3,
                       fecha_ultima_modificacion = CURRENT_TIMESTAMP`,
        [rolId, row.id, usuario]
      );
    }
  }

  private async sincronizarMenus(
    client: PoolClient,
    rolId: number,
    menus: number[],
    usuario: string
  ): Promise<void> {
    await client.query(
      `UPDATE ${this.schema}.menu_rol
          SET estado = 'INA',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE rol_id = $2 AND estado = 'ACT'`,
      [usuario, rolId]
    );

    if (menus.length === 0) return;

    const placeholders = menus.map((_, i) => `$${i + 1}`).join(',');
    const validos = await client.query<{ id: number }>(
      `SELECT id FROM ${this.schema}.menu
        WHERE id IN (${placeholders}) AND estado = 'ACT'`,
      menus // Aquí pasamos SOLO los menús
    );

    for (const row of validos.rows) {
      await client.query(
        `INSERT INTO ${this.schema}.menu_rol (menu_id, rol_id, estado, usuario_creacion)
         VALUES ($1, $2, 'ACT', $3)
         ON CONFLICT (menu_id, rol_id)
         DO UPDATE SET estado = 'ACT',
                       usuario_ultima_modificacion = $3,
                       fecha_ultima_modificacion = CURRENT_TIMESTAMP`,
        [row.id, rolId, usuario]
      );
    }
  }

  async obtenerMatrizUsuario(usuarioId: number) {
    const rol = await query<{ rol_id: number; codigo: string; nombre: string }>(
      `SELECT r.id AS rol_id, r.codigo, r.nombre
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
        WHERE ur.usuario_id = $1
          AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
        ORDER BY ur.fecha_desde DESC, ur.id DESC
        LIMIT 1`,
      [usuarioId]
    );

    if (rol.rows.length === 0) {
      return { rol: null, permisos: [], menus: [] };
    }

    const permisos = await query<{ clave: string; modulo: string; accion: string }>(
      `SELECT DISTINCT p.clave, p.modulo, p.accion
         FROM ${this.schema}.rol_permiso rp
         JOIN ${this.schema}.permiso p ON p.id = rp.permiso_id AND p.estado = 'ACT'
        WHERE rp.rol_id = $1 AND rp.estado = 'ACT'
        ORDER BY p.modulo, p.accion`,
      [rol.rows[0].rol_id]
    );

    const menus = await query<{
      id: number;
      clave: string;
      etiqueta: string;
      ruta: string | null;
      icono: string | null;
      menu_padre_id: number | null;
      orden: number;
    }>(
      `SELECT m.id, m.clave, m.etiqueta, m.ruta, m.icono, m.menu_padre_id, m.orden
         FROM ${this.schema}.menu_rol mr
         JOIN ${this.schema}.menu m ON m.id = mr.menu_id AND m.estado = 'ACT'
        WHERE mr.rol_id = $1 AND mr.estado = 'ACT'
        ORDER BY COALESCE(m.menu_padre_id, m.id), m.orden`,
      [rol.rows[0].rol_id]
    );

    type MenuRow = (typeof menus.rows)[number] & { hijos?: MenuRow[] };
    const nodos = menus.rows as MenuRow[];
    const map = new Map<number, MenuRow>();
    nodos.forEach((n) => map.set(n.id, { ...n, hijos: [] }));

    const arbol: MenuRow[] = [];
    map.forEach((n) => {
      if (n.menu_padre_id) {
        const padre = map.get(n.menu_padre_id);
        if (padre) padre.hijos!.push(n);
      } else {
        arbol.push(n);
      }
    });

    return {
      rol: rol.rows[0],
      permisos: permisos.rows,
      menus: arbol,
    };
  }

  async listarRolesConResumen() {
    const result = await query(
      `SELECT r.id, r.codigo, r.nombre, r.descripcion, r.estado,
              (SELECT COUNT(*)::int FROM ${this.schema}.rol_permiso rp
                WHERE rp.rol_id = r.id AND rp.estado = 'ACT') AS total_permisos,
              (SELECT COUNT(*)::int FROM ${this.schema}.menu_rol mr
                WHERE mr.rol_id = r.id AND mr.estado = 'ACT') AS total_menus,
              (SELECT COUNT(*)::int FROM ${this.schema}.usuario_rol ur
                WHERE ur.rol_id = r.id AND ur.estado = 'ACT'
                  AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)) AS total_usuarios
         FROM ${this.schema}.rol r
        ORDER BY r.nombre`
    );
    return result.rows;
  }
}