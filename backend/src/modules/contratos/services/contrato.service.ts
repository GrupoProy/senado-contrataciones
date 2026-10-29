import { ContratoRepository, ContratoRow } from '../repositories/contrato.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/AppError';
import {
  CrearContratoDto,
  ActualizarContratoDto,
  CambiarEstadoContratoDto,
  ListarContratosDto,
} from '../dto/contrato.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class ContratoService {
  private repository = new ContratoRepository();
  private schema = env.db.schema;

  async listar(dto: ListarContratosDto) {
    return this.repository.listar(dto);
  }
    async listarRequerimientosDisponibles() {
    return this.repository.listarRequerimientosDisponiblesParaContrato();
  }

  async obtenerPorId(id: number) {
    const c = await this.repository.obtenerPorId(id);
    if (!c) throw new NotFoundError('Contrato no encontrado');
    return c;
  }

  

    async crear(dto: CrearContratoDto, usuarioCreacion: string) {
    // ─── Validar fechas ──────────────────────────────────────────────
    const desde = new Date(dto.fechaDesde).getTime();
    const hasta = new Date(dto.fechaHasta).getTime();

    if (Number.isNaN(desde) || Number.isNaN(hasta)) {
      throw new ValidationError('Formato de fecha inválido');
    }
    if (hasta <= desde) {
      throw new ValidationError(
        'fechaHasta debe ser estrictamente mayor que fechaDesde'
      );
    }
    if (dto.fechaFirma) {
      const firma = new Date(dto.fechaFirma).getTime();
      if (firma > hasta) {
        throw new ValidationError('fechaFirma no puede ser posterior a fechaHasta');
      }
    }

    // ─── Validar persona ─────────────────────────────────────────────
    const persona = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.persona
        WHERE id = $1 AND estado = 'ACT'`,
      [dto.personaId]
    );
    if (parseInt(persona.rows[0].count, 10) === 0) {
      throw new ValidationError('La persona indicada no existe o está inactiva');
    }

    // ─── Validar requerimiento ───────────────────────────────────────
    const req = await query<{ estado_codigo: string }>(
      `SELECT estado_codigo FROM ${this.schema}.requerimiento WHERE id = $1`,
      [dto.requerimientoId]
    );
    if (req.rows.length === 0) {
      throw new ValidationError('El requerimiento indicado no existe');
    }
    if (['ANULADO', 'RECHAZADO', 'CONCLUIDO'].includes(req.rows[0].estado_codigo)) {
      throw new ValidationError(
        `No se puede crear contrato para un requerimiento en estado '${req.rows[0].estado_codigo}'`
      );
    }

    // ─── Validar contrato en curso ───────────────────────────────────
    if (await this.repository.tieneContratoEnCurso(dto.personaId)) {
      throw new ConflictError('La persona ya tiene un contrato EN_CURSO vigente');
    }

    // ─── Validar unicidad de número ──────────────────────────────────
    if (await this.repository.existeNumero(dto.numero)) {
      throw new ConflictError(`Ya existe un contrato con número '${dto.numero}'`);
    }

    // ─── Validar que el requerimiento no tenga contrato ──────────────
    if (await this.repository.existeContratoParaRequerimiento(dto.requerimientoId)) {
      throw new ConflictError('El requerimiento ya tiene un contrato asociado');
    }

    const id = await this.repository.crear(
      {
        requerimientoId: dto.requerimientoId,
        personaId: dto.personaId,
        numero: dto.numero,
        fechaDesde: dto.fechaDesde,
        fechaHasta: dto.fechaHasta,
        salarioMes: dto.salarioMes ?? null,
        fechaFirma: dto.fechaFirma ?? null,
        observaciones: dto.observaciones ?? null,
      },
      usuarioCreacion
    );

    return { id, ...dto };
  }

  async actualizar(id: number, dto: ActualizarContratoDto, usuarioModificacion: string) {
    const c: ContratoRow | null = await this.repository.obtenerPorId(id);
    if (!c) throw new NotFoundError('Contrato no encontrado');

    if (c.estadoCodigo !== 'EN_CURSO') {
      throw new ValidationError('Solo se pueden modificar contratos EN_CURSO');
    }

    // Si se actualiza fechaFirma, validar contra fechaHasta del contrato
    if (dto.fechaFirma) {
      const firma = new Date(dto.fechaFirma).getTime();
      const hasta = new Date(c.fechaHasta).getTime();
      if (firma > hasta) {
        throw new ValidationError('fechaFirma no puede ser posterior a fechaHasta');
      }
    }

    await this.repository.actualizar(id, dto, usuarioModificacion);
    return { message: 'Contrato actualizado exitosamente' };
  }

  async cambiarEstado(
    id: number,
    dto: CambiarEstadoContratoDto,
    usuarioModificacion: string
  ) {
    const c: ContratoRow | null = await this.repository.obtenerPorId(id);
    if (!c) throw new NotFoundError('Contrato no encontrado');

    const estadoActual = c.estadoCodigo;

    const transicionesPermitidas: Record<string, string[]> = {
      EN_CURSO: ['CONCLUIDO', 'ANULADO'],
      CONCLUIDO: [],
      ANULADO: [],
    };

    if (!transicionesPermitidas[estadoActual]?.includes(dto.estadoCodigo)) {
      throw new ValidationError(
        `Transición no permitida: ${estadoActual} → ${dto.estadoCodigo}`
      );
    }

    await this.repository.cambiarEstado(id, dto.estadoCodigo, usuarioModificacion);
    return {
      message: `Contrato cambiado a ${dto.estadoCodigo}`,
      motivo: dto.motivo,
    };
  }
}