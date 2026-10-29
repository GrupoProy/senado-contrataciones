import { MenuRepository } from '../repositories/menu.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { CrearMenuDto, ActualizarMenuDto } from '../dto/menu.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class MenuService {
  private repository = new MenuRepository();
  private schema = env.db.schema;

  async listar() {
    return this.repository.listar();
  }

  async listarPorUsuario(usuarioId: number) {
    const result = await query<{
      id: number;
      clave: string;
      etiqueta: string;
      ruta: string | null;
      icono: string | null;
      menu_padre_id: number | null;
      orden: number;
    }>(
      `SELECT DISTINCT m.id, m.clave, m.etiqueta, m.ruta, m.icono,
              m.menu_padre_id, m.orden
         FROM ${this.schema}.usuario_rol ur
         JOIN ${this.schema}.rol r ON r.id = ur.rol_id AND r.estado = 'ACT'
         JOIN ${this.schema}.menu_rol mr ON mr.rol_id = r.id AND mr.estado = 'ACT'
         JOIN ${this.schema}.menu m ON m.id = mr.menu_id AND m.estado = 'ACT'
        WHERE ur.usuario_id = $1
          AND ur.estado = 'ACT'
          AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
        ORDER BY m.menu_padre_id NULLS FIRST, m.orden`,
      [usuarioId]
    );

    // Construir árbol
    type Nodo = (typeof result.rows)[number] & { hijos?: Nodo[] };
    const nodos = result.rows as Nodo[];
    const map = new Map<number, Nodo>();
    nodos.forEach((n) => map.set(n.id, { ...n, hijos: [] }));

    const arbol: Nodo[] = [];
    map.forEach((n) => {
      if (n.menu_padre_id) {
        const padre = map.get(n.menu_padre_id);
        if (padre) padre.hijos!.push(n);
      } else {
        arbol.push(n);
      }
    });
    return arbol;
  }

  async obtenerPorId(id: number) {
    const m = await this.repository.obtenerPorId(id);
    if (!m) throw new NotFoundError('Menú no encontrado');
    return m;
  }

  async crear(dto: CrearMenuDto, usuarioCreacion: string) {
    const existe = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.menu WHERE clave = $1`,
      [dto.clave]
    );
    if (parseInt(existe.rows[0].count, 10) > 0) {
      throw new ConflictError(`Ya existe un menú con clave '${dto.clave}'`);
    }

    if (dto.menuPadreId) {
      const padre = await this.repository.obtenerPorId(dto.menuPadreId);
      if (!padre) throw new ValidationError('El menú padre indicado no existe');
    }

    const id = await this.repository.crear(
      {
        clave: dto.clave,
        etiqueta: dto.etiqueta,
        ruta: dto.ruta ?? null,
        icono: dto.icono ?? null,
        menuPadreId: dto.menuPadreId ?? null,
        orden: dto.orden,
      },
      usuarioCreacion
    );
    return { id, ...dto };
  }

  async actualizar(id: number, dto: ActualizarMenuDto, usuarioModificacion: string) {
    const m = await this.repository.obtenerPorId(id);
    if (!m) throw new NotFoundError('Menú no encontrado');

    if (dto.menuPadreId !== undefined && dto.menuPadreId !== null) {
      if (dto.menuPadreId === id) {
        throw new ValidationError('Un menú no puede ser su propio padre');
      }
    }

    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Menú actualizado exitosamente' };
  }

  async cambiarEstado(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
    const m = await this.repository.obtenerPorId(id);
    if (!m) throw new NotFoundError('Menú no encontrado');

    if (estado === 'INA') {
      const hijos = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.menu
          WHERE menu_padre_id = $1 AND estado = 'ACT'`,
        [id]
      );
      if (parseInt(hijos.rows[0].count, 10) > 0) {
        throw new ValidationError('No se puede inactivar: el menú tiene hijos activos');
      }
    }

    await this.repository.cambiarEstado(id, estado, usuarioModificacion);
    return { message: `Menú ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }
}