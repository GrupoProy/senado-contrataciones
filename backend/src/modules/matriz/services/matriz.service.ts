import { MatrizRepository } from '../repositories/matriz.repository';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';
import { SincronizarMatrizDto } from '../dto/matriz.dto';

export class MatrizService {
  private repository = new MatrizRepository();

  async listarRolesConResumen() {
    return this.repository.listarRolesConResumen();
  }

  async obtenerMatrizRol(rolId: number) {
    const matriz = await this.repository.obtenerMatrizRol(rolId);
    if (!matriz) throw new NotFoundError('Rol no encontrado');
    return matriz;
  }

  async sincronizar(
    rolId: number,
    dto: SincronizarMatrizDto,
    usuario: string
  ) {
    const matriz = await this.repository.obtenerMatrizRol(rolId);
    if (!matriz) throw new NotFoundError('Rol no encontrado');

    if (matriz.rol.codigo === 'ADMINISTRADOR') {
      // Permitir pero advertir: el admin debe conservar todos los permisos
      const totalPermisosActivos = matriz.permisos.filter((p) => p.asignado).length;
      if (dto.permisos.length < totalPermisosActivos) {
        throw new ValidationError(
          'El rol ADMINISTRADOR no puede perder permisos. Reasigne manualmente si es necesario.'
        );
      }
    }

    await this.repository.sincronizar(rolId, dto.permisos, dto.menus, usuario);

    return {
      message: 'Matriz del rol sincronizada exitosamente',
      permisosAsignados: dto.permisos.length,
      menusAsignados: dto.menus.length,
    };
  }

  async obtenerMatrizUsuario(usuarioId: number) {
    return this.repository.obtenerMatrizUsuario(usuarioId);
  }
}