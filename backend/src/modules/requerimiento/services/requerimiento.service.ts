import { transaction, query } from '../../../config/database';
import { env } from '../../../config/env';
import { RequerimientoRepository } from '../repositories/requerimiento.repository';
import { SeguimientoService } from '../../seguimiento/services/seguimiento.service';
import { ConsultarRequerimientosDto } from '../dto/requerimiento.dto';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/AppError';
import {
  CrearRequerimientoDto,
  ActualizarRequerimientoDto,
  ListarRequerimientosDto,
  DerivarDesdeRequerimientoDto,
  DerivarMasivoDesdeRequerimientoDto,
} from '../dto/requerimiento.dto';

const ESTADO_INICIAL = 'REGISTRADO';
const UNIDAD_CREADORA = 'OM';

export class RequerimientoService {
  private repository = new RequerimientoRepository();
  private seguimientoService = new SeguimientoService();
  private schema = env.db.schema;

  // ═══════════════════════════════════════════════════════════════════════
  // CREAR
  // ═══════════════════════════════════════════════════════════════════════

  async crear(dto: CrearRequerimientoDto, usuarioId: number, username: string) {
    await this.validarPuedeCrear(usuarioId);

    if (!(await this.repository.validarUnidadActiva(dto.unidadSolicitanteId))) {
      throw new ValidationError('La unidad solicitante no existe o está inactiva');
    }
    if (dto.cargoId && !(await this.repository.validarCargoActivo(dto.cargoId))) {
      throw new ValidationError('El cargo no existe o está inactivo');
    }
    if (dto.senadorId && !(await this.repository.validarSenadorActivo(dto.senadorId))) {
      throw new ValidationError('El senador indicado no existe o está inactivo');
    }

    // ─── Validar Catálogos ──────────────────────────────────────────────
    await this.validarCatalogo('PRIORIDAD_REQUERIMIENTO', dto.prioridad);
    await this.validarCatalogo('TIPO_CONTRATO', dto.tipoContrato);
    await this.validarCatalogo('TIPO_REQUERIMIENTO', dto.tipoRequerimiento);

    const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) {
      throw new ForbiddenError('El usuario no tiene una unidad asignada. Contacte al administrador.');
    }
    const unidadActualId = u.unidad_id;

    const personaExistente = await this.repository.buscarPersonaPorDocumento(
      dto.persona.tipoDocumento, dto.persona.numeroDocumento, dto.persona.complemento ?? null
    );

    if (!personaExistente) {
      if (!dto.persona.nombres || !dto.persona.primerApellido) {
        throw new ValidationError('La persona no existe. Envíe nombres y primerApellido para registrarla.');
      }
      if (dto.persona.fechaNacimiento) {
        const esMayor = await this.repository.validarPersonaMayorDeEdad(dto.persona.fechaNacimiento);
        if (!esMayor) throw new ValidationError('La persona debe ser mayor de 18 años');
      }
    } else {
      await this.validarPersonaSinProcesoActivo(personaExistente.id, dto.tipoRequerimiento);
    }

    const resultado = await transaction(async (client) => {
      let personaId: number;
      let personaFueCreada = false;

      if (personaExistente) {
        personaId = personaExistente.id;
      } else {
        personaId = await this.repository.crearPersona(
          client,
          {
            tipoDocumento: dto.persona.tipoDocumento, numeroDocumento: dto.persona.numeroDocumento,
            complemento: dto.persona.complemento ?? null, nombres: dto.persona.nombres!,
            primerApellido: dto.persona.primerApellido!, segundoApellido: dto.persona.segundoApellido ?? null,
            fechaNacimiento: dto.persona.fechaNacimiento ?? null, email: dto.persona.email ?? null, telefono: dto.persona.telefono ?? null,
          },
          username
        );
        personaFueCreada = true;
      }

      const requerimientoId = await this.repository.crear(
        client,
        {
          nroCertificacion: dto.nroCertificacion, titulo: dto.titulo, descripcion: dto.descripcion ?? null,
          personaId, cargoId: dto.cargoId ?? null, senadorId: dto.senadorId ?? null,
          unidadSolicitanteId: dto.unidadSolicitanteId, unidadActualId,
          estadoCodigo: ESTADO_INICIAL, prioridad: dto.prioridad,
          tipoContrato: dto.tipoContrato ?? null, tipoRequerimiento: dto.tipoRequerimiento ?? null,
          fechaInicioPrevista: dto.fechaInicioPrevista ?? null, fechaFinPrevista: dto.fechaFinPrevista ?? null,
        },
        username
      );

      // ✅ NUEVA LÓGICA: Ajuste de contratos vigentes si hay solapamiento de fechas
      const esNuevo = !dto.tipoRequerimiento || dto.tipoRequerimiento.toUpperCase() === 'NUEVO';
      
      if (!esNuevo && dto.fechaInicioPrevista) {
        // Buscamos TODOS los contratos en curso de esta persona
        const contratosActivos = await client.query<{ id: number; fecha_hasta: string }>(
          `SELECT id, fecha_hasta FROM ${this.schema}.contrato 
           WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO'`,
          [personaId]
        );

        for (const contrato of contratosActivos.rows) {
          // Si la fecha de inicio del nuevo requerimiento es menor o igual a la fecha fin del contrato activo
          if (new Date(dto.fechaInicioPrevista) <= new Date(contrato.fecha_hasta)) {
            const nuevaFechaHasta = this.obtenerDiaHabilAnterior(dto.fechaInicioPrevista);
            
            await client.query(
              `UPDATE ${this.schema}.contrato 
               SET fecha_hasta = $1, 
                   observaciones = COALESCE(observaciones, '') || ' [Ajuste automático por nuevo requerimiento]',
                   usuario_ultima_modificacion = $2, 
                   fecha_ultima_modificacion = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [nuevaFechaHasta, username, contrato.id]
            );
          }
        }
      }

      return { requerimientoId, personaId, personaFueCreada };
    });

    return {
      id: resultado.requerimientoId, estadoCodigo: ESTADO_INICIAL, codigo: null, unidadActualId,
      persona: {
        id: resultado.personaId, fueCreada: resultado.personaFueCreada,
        mensaje: resultado.personaFueCreada ? 'Persona registrada y vinculada al requerimiento.' : 'Persona existente reutilizada.',
      },
      mensaje: 'Requerimiento registrado. El código REQ- se generará en la primera derivación.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEER
  // ═══════════════════════════════════════════════════════════════════════

  async listar(dto: ListarRequerimientosDto, usuarioId: number) {
    const accesoGlobal = await this.tieneAccesoGlobal(usuarioId);
    let unidadIdRestringida: number | undefined;
    
    if (!accesoGlobal) {
      const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
      unidadIdRestringida = u?.unidad_id ?? -1;
    }
    
    return this.repository.listar({ ...dto, unidadIdRestringida });
  }

  async obtenerPorId(id: number, usuarioId: number) {
    const r = await this.repository.obtenerPorId(id);
    if (!r) throw new NotFoundError('Requerimiento no encontrado');
    
    const accesoGlobal = await this.tieneAccesoGlobal(usuarioId);
    
    if (!accesoGlobal) {
      const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
      const unidadUsuario = u?.unidad_id;
      const pertenece = r.unidadActualId === unidadUsuario || r.unidadSolicitanteId === unidadUsuario;
      if (!pertenece) throw new ForbiddenError('No tiene acceso a este requerimiento (fuera de su unidad)');
    }
    return r;
  }

  async bandeja(usuarioId: number, page = 1, limit = 20) {
    const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) throw new ForbiddenError('El usuario no tiene una unidad asignada para consultar bandeja');
    return this.repository.listarBandeja(u.unidad_id, page, limit);
  }

  async bandejaDerivar(usuarioId: number) {
    const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) throw new ForbiddenError('El usuario no tiene unidad asignada');
    return this.repository.listarBandejaDerivar(u.unidad_id);
  }

  async buscarPersona(tipoDocumento: string, numeroDocumento: string, complemento: string | null) {
    const persona = await this.repository.buscarPersonaCompleta(tipoDocumento.toUpperCase(), numeroDocumento, complemento);
    return {
      existe: persona !== null,
      persona: persona ? {
        id: persona.id, tipoDocumento: persona.tipo_documento, numeroDocumento: persona.numero_documento,
        complemento: persona.complemento, nombres: persona.nombres, primerApellido: persona.primer_apellido,
        segundoApellido: persona.segundo_apellido, fechaNacimiento: persona.fecha_nacimiento, genero: persona.genero,
        estadoCivil: persona.estado_civil, nacionalidad: persona.nacionalidad, email: persona.email,
        telefono: persona.telefono, direccion: persona.direccion, edad: persona.edad,
      } : null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTUALIZAR
  // ═══════════════════════════════════════════════════════════════════════

  async actualizar(id: number, dto: ActualizarRequerimientoDto, usuarioId: number, username: string) {
    const r = await this.repository.obtenerPorId(id);
    if (!r) throw new NotFoundError('Requerimiento no encontrado');

    await this.validarPuedeEditar(usuarioId, r.unidadActualId, r.unidadSolicitanteId);
    if (!['REGISTRADO', 'EN_PROCESO', 'OBSERVADO', 'SUBSANACION'].includes(r.estadoCodigo)) {
      throw new ValidationError(`No se puede editar un requerimiento en estado '${r.estadoCodigo}'`);
    }

    let personaId = undefined;
    if (dto.persona) {
      const personaExistente = await this.repository.buscarPersonaPorDocumento(
        dto.persona.tipoDocumento, dto.persona.numeroDocumento, dto.persona.complemento ?? null
      );
      
      if (personaExistente) {
        personaId = personaExistente.id;
        const proceso = await this.repository.obtenerProcesoActivoPorPersona(personaId, id);
        const esNuevo = !dto.tipoRequerimiento || dto.tipoRequerimiento.toUpperCase() === 'NUEVO';
        
        if (proceso.requerimiento || (esNuevo && proceso.contrato)) {
           throw new ConflictError('La nueva persona asignada ya tiene un proceso activo (contrato o requerimiento).');
        }
      } else {
        await transaction(async (client) => {
          personaId = await this.repository.crearPersona(client, {
            tipoDocumento: dto.persona!.tipoDocumento, numeroDocumento: dto.persona!.numeroDocumento,
            complemento: dto.persona!.complemento ?? null, nombres: dto.persona!.nombres!,
            primerApellido: dto.persona!.primerApellido!, segundoApellido: dto.persona!.segundoApellido ?? null,
            fechaNacimiento: dto.persona!.fechaNacimiento ?? null, email: dto.persona!.email ?? null, telefono: dto.persona!.telefono ?? null,
          }, username);
        });
      }
    }

    await this.repository.actualizar(id, {
      ...dto,
      personaId,
    }, username);
    
    return { message: 'Requerimiento actualizado exitosamente' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DERIVACIÓN INICIAL
  // ═══════════════════════════════════════════════════════════════════════

  async derivar(requerimientoId: number, dto: DerivarDesdeRequerimientoDto, usuarioId: number, username: string) {
    return this.seguimientoService.derivarInicial({ requerimientoId, motivo: dto.motivo ?? null, observaciones: dto.observaciones ?? null }, usuarioId, username);
  }

  async derivarMasivo(dto: DerivarMasivoDesdeRequerimientoDto, usuarioId: number, username: string) {
    return this.seguimientoService.derivarMasivoInicial({ requerimientoIds: dto.requerimientoIds, motivo: dto.motivo ?? null, observaciones: dto.observaciones ?? null }, usuarioId, username);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VALIDACIONES PRIVADAS
  // ═══════════════════════════════════════════════════════════════════════

  private async tieneAccesoGlobal(usuarioId: number): Promise<boolean> {
    const r = await query<{ tiene_acceso: boolean }>(
      `SELECT (
         EXISTS (
           SELECT 1 FROM ${this.schema}.usuario u
           JOIN ${this.schema}.unidad_organizacional uo ON uo.id = u.unidad_organizacional_id
           WHERE u.id = $1 AND uo.codigo = 'OM'
         )
         OR
         EXISTS (
           SELECT 1 FROM ${this.schema}.usuario_rol ur
           JOIN ${this.schema}.rol r ON r.id = ur.rol_id
           WHERE ur.usuario_id = $1 
             AND r.codigo IN ('ADMINISTRADOR', 'SUPERVISOR') 
             AND ur.estado = 'ACT' AND r.estado = 'ACT' 
             AND (ur.fecha_hasta IS NULL OR ur.fecha_hasta >= CURRENT_DATE)
         )
       ) AS tiene_acceso`,
      [usuarioId]
    );
    return r.rows[0]?.tiene_acceso ?? false;
  }

  private async validarPuedeCrear(usuarioId: number): Promise<void> {
    if (await this.tieneAccesoGlobal(usuarioId)) return;
    const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
    if (u?.unidad_codigo !== UNIDAD_CREADORA) {
      throw new ForbiddenError(`Solo la unidad ${UNIDAD_CREADORA} puede registrar requerimientos`);
    }
  }

  private async validarPuedeEditar(usuarioId: number, unidadActualId: number | null, unidadSolicitanteId: number): Promise<void> {
    if (await this.tieneAccesoGlobal(usuarioId)) return;
    const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
    const unidadUsuario = u?.unidad_id;
    const permitido = unidadUsuario !== null && unidadUsuario !== undefined && (unidadActualId === unidadUsuario || unidadSolicitanteId === unidadUsuario);
    if (!permitido) throw new ForbiddenError('No puede editar un requerimiento fuera de su unidad');
  }

  private async validarPersonaSinProcesoActivo(personaId: number, tipoRequerimiento?: string | null): Promise<void> {
    const reqActivo = await this.repository.tieneRequerimientoActivo(personaId);
    if (reqActivo.tieneActivo) {
      const codRef = reqActivo.codigo ?? `#${reqActivo.requerimientoId}`;
      throw new ConflictError(`La persona ya tiene un requerimiento en proceso (${codRef}, estado: '${reqActivo.estadoCodigo}'). Solo se puede registrar uno nuevo cuando el anterior esté FINALIZADO, RECHAZADO, CONCLUIDO o ANULADO.`);
    }
    
    const esNuevo = !tipoRequerimiento || tipoRequerimiento.toUpperCase() === 'NUEVO';
    
    if (esNuevo) {
      const contratoActivo = await this.repository.tieneContratoEnCurso(personaId);
      if (contratoActivo.tieneContrato) {
        throw new ConflictError(`La persona ya tiene un contrato EN_CURSO (${contratoActivo.numero}). No se puede iniciar un nuevo proceso de contratación de tipo NUEVO mientras el contrato esté vigente.`);
      }
    }
  }

  async obtenerProcesoActivoPorPersona(personaId: number, usuarioId: number, excludeRequerimientoId?: number){
    const existe = await this.repository.existePersonaActiva(personaId);
    if (!existe) throw new NotFoundError('Persona no encontrada o inactiva');
    
    const accesoGlobal = await this.tieneAccesoGlobal(usuarioId);
    if (!accesoGlobal) {
      const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
      if (!u?.unidad_id) throw new ForbiddenError('El usuario no tiene unidad asignada');
    }
    const proceso = await this.repository.obtenerProcesoActivoPorPersona(personaId, excludeRequerimientoId);
    const tieneActivo = proceso.requerimiento !== null || proceso.contrato !== null;
    let motivoBloqueo: string | null = null;

    if (proceso.requerimiento) {
      const ref = proceso.requerimiento.codigo ?? `#${proceso.requerimiento.id}`;
      motivoBloqueo = `La persona ya tiene un requerimiento en proceso (${ref}, estado: '${proceso.requerimiento.estadoCodigo}').`;
    } else if (proceso.contrato) {
      motivoBloqueo = `La persona ya tiene un contrato EN_CURSO (${proceso.contrato.numero}).`;
    }

    return { personaId, tieneProcesoActivo: tieneActivo, puedeRegistrarNuevo: !tieneActivo, motivoBloqueo, requerimiento: proceso.requerimiento, contrato: proceso.contrato };
  }

  async obtenerEstadisticas(usuarioId: number) {
    const accesoGlobal = await this.tieneAccesoGlobal(usuarioId);
    let unidadIdRestringida: number | undefined;
    
    if (!accesoGlobal) {
      const u = await this.repository.obtenerUnidadDeUsuario(usuarioId);
      unidadIdRestringida = u?.unidad_id ?? -1;
    }
    
    return this.repository.obtenerEstadisticas(unidadIdRestringida);
  }


    async consultar(dto: ConsultarRequerimientosDto) {
    return this.repository.consultar(dto);
  }

  private async validarCatalogo(catalogo: string, codigo: string | null | undefined): Promise<void> {
    if (!codigo) return;
    const r = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM ${this.schema}.catalogo_detalle d
         JOIN ${this.schema}.catalogos c ON c.id = d.catalogo_id
        WHERE c.codigo = $1 AND d.codigo = $2 AND d.estado = 'ACT'`,
      [catalogo, codigo.toUpperCase()]
    );
    if (parseInt(r.rows[0].count, 10) === 0) {
      throw new ValidationError(`El código '${codigo}' no es válido para el catálogo ${catalogo}`);
    }
  }

  /**
   * ✅ Calcula el día hábil anterior (Lunes a Viernes) a una fecha dada.
   */
  private obtenerDiaHabilAnterior(fechaStr: string): string {
    const d = new Date(fechaStr + 'T12:00:00Z'); // Usamos UTC mediodía para evitar desfase
    d.setUTCDate(d.getUTCDate() - 1); // Retrocedemos 1 día
    
    // 0 = Domingo, 6 = Sábado
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() - 1);
    }
    
    return d.toISOString().split('T')[0];
  }
}