import { PersonaRepository } from '../repositories/persona.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../../shared/errors/AppError';
import { CrearPersonaDto, ActualizarPersonaDto } from '../dto/persona.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class PersonaService {
  private repository = new PersonaRepository();
  private schema = env.db.schema;

  async listar(params: { page: number; limit: number; search?: string }) {
    return this.repository.listar(params);
  }

  async obtenerPorId(id: number) {
    const persona = await this.repository.obtenerPorId(id);
    if (!persona) throw new NotFoundError('Persona no encontrada');
    return persona;
  }

  async crear(dto: CrearPersonaDto, usuarioCreacion: string) {
    // Validar mayoría de edad (redundante con Zod, pero explícito en servicio)
    const edad = this.calcularEdad(dto.fechaNacimiento);
    if (edad < 18) {
      throw new ValidationError('La persona debe ser mayor de 18 años');
    }

    // Verificar si ya existe (tipo + número + complemento)
    const existente = await query<{ id: number }>(
      `SELECT id FROM ${this.schema}.persona
        WHERE tipo_documento = $1 AND numero_documento = $2
          AND (($3::varchar IS NULL AND complemento IS NULL) OR complemento = $3)`,
      [dto.tipoDocumento, dto.numeroDocumento, dto.complemento ?? null]
    );

    if (existente.rows.length > 0) {
      throw new ConflictError(
        `Ya existe una persona con ${dto.tipoDocumento} ${dto.numeroDocumento}${
          dto.complemento ? '-' + dto.complemento : ''
        }`
      );
    }

    const result = await this.repository.buscarOCrear(
      { ...dto, complemento: dto.complemento ?? null, segundoApellido: dto.segundoApellido ?? null },
      usuarioCreacion
    );

    return { id: result.id, creado: result.creado };
  }

  async actualizar(id: number, dto: ActualizarPersonaDto, usuarioModificacion: string) {
    const persona = await this.repository.obtenerPorId(id);
    if (!persona) throw new NotFoundError('Persona no encontrada');

    if (dto.fechaNacimiento) {
      const edad = this.calcularEdad(new Date(dto.fechaNacimiento));
      if (edad < 18) {
        throw new ValidationError('La persona debe ser mayor de 18 años');
      }
    }

    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Persona actualizada exitosamente' };
  }

  async eliminar(id: number, usuarioModificacion: string) {
    const persona = await this.repository.obtenerPorId(id);
    if (!persona) throw new NotFoundError('Persona no encontrada');

    await this.repository.eliminarLogico(id, usuarioModificacion);
    return { message: 'Persona eliminada lógicamente' };
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) edad--;
    return edad;
  }
}