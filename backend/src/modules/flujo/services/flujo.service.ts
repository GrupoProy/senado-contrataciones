import { FlujoRepository } from '../repositories/flujo.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/AppError';
import {
  CrearFlujoDto,
  ActualizarFlujoDto,
  ListarFlujosDto,
  CrearTransicionDto,
  ActualizarTransicionDto,
  ListarTransicionesDto,
} from '../dto/flujo.dto';
import { query } from '../../../config/database';
import { env } from '../../../config/env';

/**
 * Catálogos válidos para validar los códigos de las transiciones.
 * Se leen de catalogo_detalle; nada hardcodeado salvo el nombre del catálogo.
 */
const CATALOGOS_VALIDOS = {
  ESTADO_SEGUIMIENTO: 'estado',
  ACCION_WORKFLOW: 'acción',
  TIPO_MOVIMIENTO: 'tipo de movimiento',
  RESULTADO: 'resultado',
} as const;

type CatalogoNombre = keyof typeof CATALOGOS_VALIDOS;

export class FlujoService {
  private repository = new FlujoRepository();
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // FLUJOS
  // ═══════════════════════════════════════════════════════════════════════

  async listarFlujos(dto: ListarFlujosDto) {
    return this.repository.listarFlujos(dto);
  }

  async obtenerFlujoPorId(id: number) {
    const f = await this.repository.obtenerFlujoPorId(id);
    if (!f) throw new NotFoundError('Flujo no encontrado');
    return f;
  }

  async obtenerFlujoPorCodigo(codigo: string) {
    const f = await this.repository.obtenerFlujoPorCodigo(codigo.toUpperCase());
    if (!f) throw new NotFoundError(`Flujo '${codigo}' no encontrado`);
    return f;
  }

  async crearFlujo(dto: CrearFlujoDto, usuarioCreacion: string) {
    const existe = await this.repository.obtenerFlujoPorCodigo(dto.codigo);
    if (existe) {
      throw new ConflictError(`Ya existe un flujo con código '${dto.codigo}'`);
    }

    const id = await this.repository.crearFlujo(
      {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        version: dto.version,
      },
      usuarioCreacion
    );

    return { id, ...dto };
  }

  async actualizarFlujo(
    id: number,
    dto: ActualizarFlujoDto,
    usuarioModificacion: string
  ) {
    const f = await this.repository.obtenerFlujoPorId(id);
    if (!f) throw new NotFoundError('Flujo no encontrado');

    await this.repository.actualizarFlujo(id, dto, usuarioModificacion);
    return { message: 'Flujo actualizado exitosamente' };
  }

  async cambiarEstadoFlujo(id: number, estado: 'ACT' | 'INA', usuarioModificacion: string) {
    const f = await this.repository.obtenerFlujoPorId(id);
    if (!f) throw new NotFoundError('Flujo no encontrado');

    if (estado === 'INA') {
      const activas = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${this.schema}.flujo_transicion
          WHERE flujo_id = $1 AND estado = 'ACT'`,
        [id]
      );
      if (parseInt(activas.rows[0].count, 10) > 0) {
        throw new ValidationError(
          'No se puede inactivar el flujo: tiene transiciones activas. ' +
            'Inactive primero las transiciones.'
        );
      }
    }

    await this.repository.cambiarEstadoFlujo(id, estado, usuarioModificacion);
    return { message: `Flujo ${estado === 'ACT' ? 'activado' : 'inactivado'}` };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSICIONES
  // ═══════════════════════════════════════════════════════════════════════

  async listarTransiciones(flujoId: number, dto: ListarTransicionesDto) {
    const flujo = await this.repository.obtenerFlujoPorId(flujoId);
    if (!flujo) throw new NotFoundError('Flujo no encontrado');

    return this.repository.listarTransiciones(flujoId, {
      unidadOrigenId: dto.unidadOrigenId,
      estadoOrigenCodigo: dto.estadoOrigenCodigo,
      accionCodigo: dto.accionCodigo,
      soloActivos: dto.soloActivos,
    });
  }

  async crearTransicion(flujoId: number, dto: CrearTransicionDto, usuarioCreacion: string) {
    const flujo = await this.repository.obtenerFlujoPorId(flujoId);
    if (!flujo) throw new NotFoundError('Flujo no encontrado');
    if (flujo.estado !== 'ACT') {
      throw new ValidationError('No se pueden agregar transiciones a un flujo inactivo');
    }

    // ─── Validar unidades ─────────────────────────────────────────────
    await this.validarUnidad(dto.unidadOrigenId, 'origen');
    if (dto.unidadDestinoId) {
      await this.validarUnidad(dto.unidadDestinoId, 'destino');
    }

    // ─── Validar códigos contra catálogos ─────────────────────────────
    if (dto.estadoOrigenCodigo) {
      await this.validarCodigoCatalogo('ESTADO_SEGUIMIENTO', dto.estadoOrigenCodigo);
    }
    await this.validarCodigoCatalogo('ESTADO_SEGUIMIENTO', dto.estadoDestinoCodigo);
    await this.validarCodigoCatalogo('ACCION_WORKFLOW', dto.accionCodigo);
    await this.validarCodigoCatalogo('TIPO_MOVIMIENTO', dto.tipoMovimientoCodigo);
    if (dto.resultadoCodigo) {
      await this.validarCodigoCatalogo('RESULTADO', dto.resultadoCodigo);
    }

    // ─── Regla: si permite finalización, no puede tener unidad destino ─
    if (dto.permiteFinalizacion && dto.unidadDestinoId) {
      throw new ValidationError(
        'Una transición que permite finalización no puede tener unidad destino'
      );
    }
    if (!dto.permiteFinalizacion && !dto.unidadDestinoId) {
      throw new ValidationError(
        'Una transición que no finaliza debe tener unidad destino'
      );
    }

    // ─── Unicidad activa (flujo, unidad_origen, estado_origen, acción) ─
    const existe = await this.repository.existeTransicionActiva(
      flujoId,
      dto.unidadOrigenId,
      dto.estadoOrigenCodigo ?? null,
      dto.accionCodigo
    );
    if (existe) {
      throw new ConflictError(
        `Ya existe una transición activa para (unidad origen=${dto.unidadOrigenId}, ` +
          `estado origen='${dto.estadoOrigenCodigo ?? 'INICIAL'}', acción='${dto.accionCodigo}'). ` +
          `Inactívela antes de crear otra.`
      );
    }

    const id = await this.repository.crearTransicion(
      flujoId,
      {
        unidadOrigenId: dto.unidadOrigenId,
        estadoOrigenCodigo: dto.estadoOrigenCodigo ?? null,
        accionCodigo: dto.accionCodigo,
        unidadDestinoId: dto.unidadDestinoId ?? null,
        estadoDestinoCodigo: dto.estadoDestinoCodigo,
        tipoMovimientoCodigo: dto.tipoMovimientoCodigo,
        resultadoCodigo: dto.resultadoCodigo ?? null,
        requiereObservacion: dto.requiereObservacion,
        requiereMotivo: dto.requiereMotivo,
        permiteFinalizacion: dto.permiteFinalizacion,
      },
      usuarioCreacion
    );

    return { id, ...dto };
  }

  async actualizarTransicion(
    transicionId: number,
    dto: ActualizarTransicionDto,
    usuarioModificacion: string
  ) {
    const t = await this.repository.obtenerTransicionPorId(transicionId);
    if (!t) throw new NotFoundError('Transición no encontrada');

    if (dto.unidadDestinoId) {
      await this.validarUnidad(dto.unidadDestinoId, 'destino');
    }
    if (dto.estadoDestinoCodigo) {
      await this.validarCodigoCatalogo('ESTADO_SEGUIMIENTO', dto.estadoDestinoCodigo);
    }
    if (dto.tipoMovimientoCodigo) {
      await this.validarCodigoCatalogo('TIPO_MOVIMIENTO', dto.tipoMovimientoCodigo);
    }
    if (dto.resultadoCodigo) {
      await this.validarCodigoCatalogo('RESULTADO', dto.resultadoCodigo);
    }

    // Regla: no puede quedar con "permite_finalizacion=true" y unidad destino a la vez
    const permiteFinal = dto.permiteFinalizacion ?? t.permite_finalizacion;
    const unidadDest = dto.unidadDestinoId !== undefined ? dto.unidadDestinoId : t.unidad_destino_id;
    if (permiteFinal && unidadDest) {
      throw new ValidationError(
        'Una transición que permite finalización no puede tener unidad destino'
      );
    }
    if (!permiteFinal && !unidadDest) {
      throw new ValidationError(
        'Una transición que no finaliza debe tener unidad destino'
      );
    }

    await this.repository.actualizarTransicion(transicionId, dto, usuarioModificacion);
    return { message: 'Transición actualizada exitosamente' };
  }

  async cambiarEstadoTransicion(
    transicionId: number,
    estado: 'ACT' | 'INA',
    usuarioModificacion: string
  ) {
    const t = await this.repository.obtenerTransicionPorId(transicionId);
    if (!t) throw new NotFoundError('Transición no encontrada');

    if (estado === 'ACT') {
      // Al reactivar, verificar que no exista otra activa con la misma clave
      const existe = await this.repository.existeTransicionActiva(
        t.flujo_id,
        t.unidad_origen_id,
        t.estado_origen_codigo,
        t.accion_codigo,
        transicionId
      );
      if (existe) {
        throw new ConflictError(
          `Ya existe otra transición activa para (unidad origen=${t.unidad_origen_id}, ` +
            `estado origen='${t.estado_origen_codigo ?? 'INICIAL'}', acción='${t.accion_codigo}').`
        );
      }
    }

    await this.repository.cambiarEstadoTransicion(transicionId, estado, usuarioModificacion);
    return { message: `Transición ${estado === 'ACT' ? 'activada' : 'inactivada'}` };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS DE CONTEXTO (usadas por el módulo de requerimientos)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Devuelve las acciones disponibles dado (flujo, unidad, estado actual).
   * El frontend usa esta respuesta para habilitar/deshabilitar botones.
   */
  async listarAccionesDisponibles(
    flujoCodigo: string,
    unidadId: number,
    estadoActualCodigo: string | null
  ) {
    const flujo = await this.repository.obtenerFlujoPorCodigo(flujoCodigo.toUpperCase());
    if (!flujo) throw new NotFoundError(`Flujo '${flujoCodigo}' no encontrado`);
    if (flujo.estado !== 'ACT') {
      throw new ValidationError('El flujo está inactivo');
    }

    return this.repository.listarAccionesDisponibles(
      flujo.id,
      unidadId,
      estadoActualCodigo
    );
  }

  /**
   * Valida una transición puntual. Es el método que el módulo de
   * requerimientos llamará antes de cada acción del workflow.
   *
   * Devuelve:
   *   - valida: true + reglas que debe cumplir el request
   *   - valida: false + motivo
   */
  async validarTransicion(
    flujoCodigo: string,
    unidadId: number,
    estadoActualCodigo: string | null,
    accionCodigo: string
  ) {
    const flujo = await this.repository.obtenerFlujoPorCodigo(flujoCodigo.toUpperCase());
    if (!flujo) {
      return {
        valida: false,
        motivo: `Flujo '${flujoCodigo}' no encontrado`,
      };
    }
    if (flujo.estado !== 'ACT') {
      return {
        valida: false,
        motivo: 'El flujo está inactivo',
      };
    }

    const t = await this.repository.validarTransicion(
      flujo.id,
      unidadId,
      estadoActualCodigo,
      accionCodigo
    );

    if (!t) {
      return {
        valida: false,
        motivo: `No existe transición activa para (unidad=${unidadId}, ` +
          `estado='${estadoActualCodigo ?? 'INICIAL'}', acción='${accionCodigo}')`,
      };
    }

    return {
      valida: true,
      transicionId: t.id,
      requiereObservacion: t.requiere_observacion,
      requiereMotivo: t.requiere_motivo,
      permiteFinalizacion: t.permite_finalizacion,
      unidadDestinoId: t.unidad_destino_id,
      estadoDestinoCodigo: t.estado_destino_codigo,
      tipoMovimientoCodigo: t.tipo_movimiento_codigo,
      resultadoCodigo: t.resultado_codigo,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Validaciones privadas
  // ═══════════════════════════════════════════════════════════════════════

  private async validarUnidad(unidadId: number, rol: 'origen' | 'destino'): Promise<void> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.schema}.unidad_organizacional
        WHERE id = $1 AND estado = 'ACT'`,
      [unidadId]
    );
    if (parseInt(r.rows[0].count, 10) === 0) {
      throw new ValidationError(`La unidad ${rol} no existe o está inactiva`);
    }
  }

  /**
   * Valida que un código exista y esté activo en el catálogo indicado.
   * Nada hardcodeado: todo desde catalogo_detalle.
   */
  private async validarCodigoCatalogo(
    catalogo: CatalogoNombre,
    codigo: string
  ): Promise<void> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.catalogo_detalle d
         JOIN ${this.schema}.catalogos c ON c.id = d.catalogo_id
        WHERE c.codigo = $1
          AND c.estado = 'ACT'
          AND d.codigo = $2
          AND d.estado = 'ACT'`,
      [catalogo, codigo.toUpperCase()]
    );
    if (parseInt(r.rows[0].count, 10) === 0) {
      throw new ValidationError(
        `El código '${codigo}' no es válido para ${CATALOGOS_VALIDOS[catalogo]}`
      );
    }
  }
}