import { transaction, query } from '../../../config/database';
import { env } from '../../../config/env';
import { SeguimientoRepository } from '../repositories/seguimiento.repository';
import { RequerimientoRepository } from '../../requerimiento/repositories/requerimiento.repository';
import { FlujoService } from '../../flujo/services/flujo.service';
import {
  ForbiddenError, NotFoundError, ValidationError,
} from '../../../shared/errors/AppError';
import { generarCodigoDerivacion, generarCodigoRequerimiento, generarNumeroContrato } from '../../../shared/utils/codigo.util';
import {
  DerivarDto, DerivarMasivoDto, RecibirDto, IniciarRevisionDto, ConcluirRevisionDto,
  ElaborarContratoDto, EnviarFirmaDto, RegistrarFirmaDto, ObservarDto, SubsanarDto,
  AprobarDto, FinalizarDto, RechazarDto, NoSubsanadoDto,
} from '../dto/seguimiento.dto';
import { parametroService } from '../../parametros/services/parametro.service';

const FLUJO_CODIGO = 'CONTRATACION_PERSONAL';
type AccionSimple = 'RECIBIR' | 'INICIAR_REVISION' | 'CONCLUIR_REVISION' | 'ELABORAR_CONTRATO' | 'ENVIAR_FIRMA' | 'REGISTRAR_FIRMA' | 'OBSERVAR' | 'SUBSANAR' | 'APROBAR_CONTRATO' | 'FINALIZAR' | 'RECHAZAR' | 'NO_SUBSANADO';

interface PersonaGeneroRow { genero: string | null; }
interface RequisitoReglaRow { req_codigo: string; nombre: string; }
interface RequerimientoRequisitoRow { requisito_codigo: string; verificado: boolean; observaciones: string | null; }

export class SeguimientoService {
  private repository = new SeguimientoRepository();
  private requerimientoRepository = new RequerimientoRepository();
  private flujoService = new FlujoService();
  private schema = env.db.schema;

  async derivarInicial(dto: DerivarDto, usuarioId: number, username: string) {
    return this.derivarConValidacion(dto, usuarioId, username, 'INICIAL');
  }

  async derivarMasivoInicial(dto: DerivarMasivoDto, usuarioId: number, username: string) {
    return this.derivarMasivoConValidacion(dto, usuarioId, username, 'INICIAL');
  }

  async derivarPosterior(dto: DerivarDto, usuarioId: number, username: string) {
    return this.derivarConValidacion(dto, usuarioId, username, 'POSTERIOR');
  }

  async derivarMasivoPosterior(dto: DerivarMasivoDto, usuarioId: number, username: string) {
    return this.derivarMasivoConValidacion(dto, usuarioId, username, 'POSTERIOR');
  }

  async recibir(dto: RecibirDto, usuarioId: number, username: string) {
    return this.ejecutarAccionSimple({ accion: 'RECIBIR', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones ?? null, motivo: null });
  }

  async iniciarRevision(dto: IniciarRevisionDto, usuarioId: number, username: string) {
    return this.ejecutarAccionSimple({ accion: 'INICIAR_REVISION', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones ?? null, motivo: null });
  }

  async concluirRevision(dto: ConcluirRevisionDto, usuarioId: number, username: string) {
    const checklist = await this.obtenerChecklist(dto.requerimientoId);
    const pendientes = checklist.filter(c => !c.verificado);
    
    if (pendientes.length > 0) {
      throw new ValidationError(`No se puede concluir la revisión. Faltan verificar ${pendientes.length} requisito(s) obligatorio(s).`);
    }

    return this.ejecutarAccionSimple({ 
      accion: 'CONCLUIR_REVISION', 
      requerimientoId: dto.requerimientoId, 
      usuarioId, 
      username, 
      observaciones: dto.observaciones ?? null, 
      motivo: null 
    });
  }

  async elaborarContrato(dto: ElaborarContratoDto, usuarioId: number, username: string) {
    const esAdmin = await this.requerimientoRepository.esAdministrador(usuarioId);
    const flujoId = await this.obtenerFlujoId();

    return transaction(async (client) => {
      const r = await this.requerimientoRepository.obtenerPorId(dto.requerimientoId);
      if (!r) throw new NotFoundError('Requerimiento no encontrado');

      const unidadEfectiva = esAdmin ? { unidadId: r.unidadActualId ?? r.unidadSolicitanteId } : await this.obtenerUnidadEfectiva(usuarioId, r.id);
      if (r.unidadActualId !== unidadEfectiva.unidadId) throw new ForbiddenError('La acción solo puede ejecutarse desde la unidad que tiene el requerimiento');

      const validacion = await this.flujoService.validarTransicion(FLUJO_CODIGO, unidadEfectiva.unidadId, r.estadoCodigo, 'ELABORAR_CONTRATO');
      if (!validacion.valida) throw new ValidationError(validacion.motivo ?? 'Transición no permitida');

      let salarioMes: number | null = null;
      if (r.cargoId) {
        const cargoRes = await client.query<{ salario_mes: string | number }>(`SELECT salario_mes FROM ${this.schema}.cargo WHERE id = $1`, [r.cargoId]);
        if (cargoRes.rows.length > 0) {
          const raw = cargoRes.rows[0].salario_mes;
          salarioMes = typeof raw === 'string' ? parseFloat(raw) : raw;
        }
      }

      const hoy = new Date();
      const fechaDesde = dto.fechaDesde ?? this.fechaISO(hoy);
      let fechaHasta = dto.fechaHasta;

      if (!fechaHasta) {
        if (r.fechaFinPrevista) fechaHasta = this.fechaISO(new Date(r.fechaFinPrevista));
        else { const d = new Date(fechaDesde); d.setFullYear(d.getFullYear() + 1); fechaHasta = this.fechaISO(d); }
      }

      if (new Date(fechaHasta).getTime() <= new Date(fechaDesde).getTime()) throw new ValidationError('fechaHasta debe ser estrictamente mayor a fechaDesde');
      if (dto.fechaFirma && new Date(dto.fechaFirma).getTime() > new Date(fechaHasta).getTime()) throw new ValidationError('fechaFirma no puede ser posterior a fechaHasta');

      const contratoExistente = await client.query<{ id: number; numero: string }>(
        `SELECT id, numero FROM ${this.schema}.contrato WHERE requerimiento_id = $1`, 
        [r.id]
      );

      let contratoId: number;
      let numeroContratoFinal: string;
      let estadoFinalContrato: string;

      if (contratoExistente.rows.length > 0) {
        contratoId = contratoExistente.rows[0].id;
        numeroContratoFinal = contratoExistente.rows[0].numero;
        
        const hayOtroEnCurso = await client.query(
          `SELECT 1 FROM ${this.schema}.contrato WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO' AND id != $2`,
          [r.personaId, contratoId]
        );
        estadoFinalContrato = hayOtroEnCurso.rows.length > 0 ? 'PENDIENTE' : 'EN_CURSO';

        await client.query(
          `UPDATE ${this.schema}.contrato
              SET fecha_desde = $1, fecha_hasta = $2, salario_mes = $3, fecha_firma = $4, 
                  observaciones = COALESCE($5, observaciones), estado_codigo = $6,
                  usuario_ultima_modificacion = $7, fecha_ultima_modificacion = CURRENT_TIMESTAMP
            WHERE id = $8`,
          [fechaDesde, fechaHasta, salarioMes, dto.fechaFirma ?? null, dto.observaciones ?? null, estadoFinalContrato, username, contratoId]
        );
      } else {
        const contratoEnCursoRes = await client.query<{ id: number; fecha_hasta: string }>(
          `SELECT id, fecha_hasta::text FROM ${this.schema}.contrato WHERE persona_id = $1 AND estado_codigo = 'EN_CURSO' LIMIT 1`,
          [r.personaId]
        );

        if (contratoEnCursoRes.rows.length > 0) {
          estadoFinalContrato = 'PENDIENTE';
          const contratoAnterior = contratoEnCursoRes.rows[0];
          
          if (new Date(fechaDesde) > new Date(contratoAnterior.fecha_hasta)) {
            const nuevaFechaHastaAnterior = await this.calcularDiaHabilAnterior(fechaDesde, client);
            
            await client.query(
              `UPDATE ${this.schema}.contrato
               SET fecha_hasta = $1,
                   observaciones = COALESCE(observaciones, '') || ' [Extensión automática por nuevo contrato PENDIENTE]',
                   usuario_ultima_modificacion = $2,
                   fecha_ultima_modificacion = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [nuevaFechaHastaAnterior, username, contratoAnterior.id]
            );
          }
        } else {
          estadoFinalContrato = 'EN_CURSO';
        }

        numeroContratoFinal = generarNumeroContrato();
        const contratoResult = await client.query<{ id: number }>(
          `INSERT INTO ${this.schema}.contrato
             (requerimiento_id, persona_id, numero, fecha_desde, fecha_hasta, salario_mes, fecha_firma, observaciones, estado_codigo, usuario_creacion)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
          [r.id, r.personaId, numeroContratoFinal, fechaDesde, fechaHasta, salarioMes, dto.fechaFirma ?? null, dto.observaciones ?? null, estadoFinalContrato, username]
        );
        contratoId = contratoResult.rows[0].id;
      }

      const siguiente = await this.repository.siguienteNumero(client, r.id);
      const seguimientoId = await this.repository.crear(client, {
        requerimientoId: r.id, numeroSeguimiento: siguiente, seguimientoOrigenId: r.seguimientoActualId, flujoId,
        unidadOrigenId: unidadEfectiva.unidadId, usuarioEnvio: username, unidadDestinoId: validacion.unidadDestinoId ?? null,
        estadoCodigo: validacion.estadoDestinoCodigo!, accionCodigo: 'ELABORAR_CONTRATO', tipoMovimientoCodigo: validacion.tipoMovimientoCodigo!,
        resultadoCodigo: validacion.resultadoCodigo ?? null, codigoDerivacion: null, unidadResponsableObservacionId: null,
        fechaObservacion: null, fechaSubsanacion: null, usuarioRecepcion: null, fechaRecepcion: null, usuarioRevision: null,
        fechaInicioRevision: null, fechaFinRevision: null, usuarioFinalizacion: null, fechaFinalizacion: null,
        observaciones: dto.observaciones ?? null, motivo: null,
      }, username);

      await this.requerimientoRepository.actualizarPorAccion(client, r.id, {
        estadoCodigo: validacion.estadoDestinoCodigo!, unidadActualId: validacion.unidadDestinoId ?? r.unidadActualId, seguimientoActualId: seguimientoId,
      }, username);

      return { contratoId, numeroContrato: numeroContratoFinal, estadoContrato: estadoFinalContrato, seguimientoId, estadoDestino: validacion.estadoDestinoCodigo, unidadDestinoId: validacion.unidadDestinoId ?? null, salarioMes, fechaDesde, fechaHasta };
    });
  }

  async enviarFirma(dto: EnviarFirmaDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'ENVIAR_FIRMA', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones ?? null, motivo: null }); }
  async registrarFirma(dto: RegistrarFirmaDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'REGISTRAR_FIRMA', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones ?? null, motivo: null }); }
  
  async observar(dto: ObservarDto, usuarioId: number, username: string) { 
    return this.ejecutarAccionSimple({ 
      accion: 'OBSERVAR', 
      requerimientoId: dto.requerimientoId, 
      usuarioId, 
      username, 
      observaciones: dto.observaciones, 
      motivo: null, 
      unidadResponsableObservacionId: dto.unidadResponsableObservacionId ?? undefined 
    }); 
  }
  
  async subsanar(dto: SubsanarDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'SUBSANAR', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones, motivo: null }); }
  async aprobar(dto: AprobarDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'APROBAR_CONTRATO', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones ?? null, motivo: null }); }
  async finalizar(dto: FinalizarDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'FINALIZAR', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones ?? null, motivo: null, resultadoFinalCodigo: dto.resultadoFinalCodigo ?? null, tipoFinalizacionCodigo: dto.tipoFinalizacionCodigo ?? null }); }
  async rechazar(dto: RechazarDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'RECHAZAR', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones, motivo: dto.motivo }); }
  async noSubsanado(dto: NoSubsanadoDto, usuarioId: number, username: string) { return this.ejecutarAccionSimple({ accion: 'NO_SUBSANADO', requerimientoId: dto.requerimientoId, usuarioId, username, observaciones: dto.observaciones, motivo: dto.motivo }); }

  async historial(requerimientoId: number, usuarioId: number, page = 1, limit = 50) {
    const esAdmin = await this.requerimientoRepository.esAdministrador(usuarioId);
    if (!esAdmin) {
      const r = await this.requerimientoRepository.obtenerPorId(requerimientoId);
      if (!r) throw new NotFoundError('Requerimiento no encontrado');
      const u = await this.requerimientoRepository.obtenerUnidadDeUsuario(usuarioId);
      const pertenece = r.unidadActualId === u?.unidad_id || r.unidadSolicitanteId === u?.unidad_id;
      if (!pertenece) throw new ForbiddenError('No tiene acceso al historial de este requerimiento');
    }
    return this.repository.listarPorRequerimiento(requerimientoId, page, limit);
  }

  async bandeja(usuarioId: number, page = 1, limit = 20) {
    const u = await this.requerimientoRepository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) throw new ForbiddenError('El usuario no tiene unidad asignada');
    return this.repository.listarBandeja(u.unidad_id, page, limit);
  }

  async listarDerivables(usuarioId: number) {
    const u = await this.requerimientoRepository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) throw new ForbiddenError('El usuario no tiene una unidad asignada');
    return this.repository.listarDerivables(u.unidad_id);
  }

  async obtenerPorId(id: number, usuarioId: number) {
    const s = await this.repository.obtenerPorId(id);
    if (!s) throw new NotFoundError('Movimiento de seguimiento no encontrado');
    const esAdmin = await this.requerimientoRepository.esAdministrador(usuarioId);
    if (!esAdmin) {
      const u = await this.requerimientoRepository.obtenerUnidadDeUsuario(usuarioId);
      const permitido = s.unidadOrigenId === u?.unidad_id || s.unidadDestinoId === u?.unidad_id;
      if (!permitido) throw new ForbiddenError('No tiene acceso a este movimiento');
    }
    return s;
  }

  private async derivarConValidacion(dto: DerivarDto, usuarioId: number, username: string, tipo: 'INICIAL' | 'POSTERIOR') {
    const esAdmin = await this.requerimientoRepository.esAdministrador(usuarioId);
    const flujoId = await this.obtenerFlujoId();

    return transaction(async (client) => {
      const r = await this.requerimientoRepository.obtenerPorId(dto.requerimientoId);
      if (!r) throw new NotFoundError('Requerimiento no encontrado');

      if (tipo === 'INICIAL') {
        if (r.estadoCodigo !== 'REGISTRADO') throw new ValidationError(`La derivación inicial solo aplica a requerimientos en estado REGISTRADO. Estado actual: '${r.estadoCodigo}'. Use la bandeja de seguimiento.`);
        if (r.seguimientoActualId !== null) throw new ValidationError('El requerimiento ya tiene seguimientos previos. Use la bandeja de seguimiento.');
      } else {
        if (r.estadoCodigo === 'REGISTRADO') throw new ValidationError('Los requerimientos en estado REGISTRADO deben derivarse desde la bandeja de requerimiento.');
      }

      const unidadEfectiva = esAdmin ? { unidadId: r.unidadActualId ?? r.unidadSolicitanteId } : await this.obtenerUnidadEfectiva(usuarioId, r.id);
      if (r.unidadActualId !== unidadEfectiva.unidadId) throw new ForbiddenError('No puede derivar un requerimiento que no está en su unidad');
      if (['FINALIZADO', 'ANULADO', 'RECHAZADO', 'CONCLUIDO'].includes(r.estadoCodigo)) throw new ValidationError(`El requerimiento está en estado '${r.estadoCodigo}' y no puede derivarse`);

      const validacion = await this.flujoService.validarTransicion(FLUJO_CODIGO, unidadEfectiva.unidadId, r.estadoCodigo, 'DERIVAR');
      if (!validacion.valida) throw new ValidationError(validacion.motivo ?? 'Transición no permitida');
      
      if (validacion.unidadDestinoId === unidadEfectiva.unidadId) {
        throw new ValidationError('No se puede derivar un requerimiento a su misma unidad actual.');
      }

      if (validacion.unidadDestinoId) {
        const uOrigen = await client.query<{ codigo: string }>(`SELECT codigo FROM ${this.schema}.unidad_organizacional WHERE id = $1`, [unidadEfectiva.unidadId]);
        const uDestino = await client.query<{ codigo: string }>(`SELECT codigo FROM ${this.schema}.unidad_organizacional WHERE id = $1`, [validacion.unidadDestinoId]);
        
        if (uOrigen.rows[0]?.codigo === 'DGAL' && uDestino.rows[0]?.codigo === 'OM') {
          const contrato = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this.schema}.contrato WHERE requerimiento_id = $1`, [r.id]);
          if (parseInt(contrato.rows[0].count, 10) === 0) {
            throw new ValidationError('No se puede derivar a Oficina Mayor sin un contrato elaborado. Por favor, realice la acción "Elaborar contrato" primero.');
          }
        }
      }

      if (validacion.requiereObservacion && !dto.observaciones) throw new ValidationError('Esta derivación requiere observaciones');
      if (validacion.requiereMotivo && !dto.motivo) throw new ValidationError('Esta derivación requiere motivo');
      if (!validacion.unidadDestinoId) throw new ValidationError('La transición no tiene unidad destino');

      const codigoDerivacion = generarCodigoDerivacion();
      const codigoRequerimiento = r.codigo ?? generarCodigoRequerimiento();
      const siguiente = await this.repository.siguienteNumero(client, r.id);

      const seguimientoId = await this.repository.crear(client, {
        requerimientoId: r.id, numeroSeguimiento: siguiente, seguimientoOrigenId: r.seguimientoActualId, flujoId,
        unidadOrigenId: unidadEfectiva.unidadId, usuarioEnvio: username, unidadDestinoId: validacion.unidadDestinoId,
        estadoCodigo: validacion.estadoDestinoCodigo!, accionCodigo: 'DERIVAR', tipoMovimientoCodigo: validacion.tipoMovimientoCodigo!,
        resultadoCodigo: validacion.resultadoCodigo ?? null, codigoDerivacion, unidadResponsableObservacionId: null,
        fechaObservacion: null, fechaSubsanacion: null, usuarioRecepcion: null, fechaRecepcion: null, usuarioRevision: null,
        fechaInicioRevision: null, fechaFinRevision: null, usuarioFinalizacion: null, fechaFinalizacion: null,
        observaciones: dto.observaciones ?? null, motivo: dto.motivo ?? null,
      }, username);

      await this.requerimientoRepository.actualizarPorAccion(client, r.id, {
        codigo: r.codigo === null ? codigoRequerimiento : undefined, estadoCodigo: validacion.estadoDestinoCodigo!,
        unidadActualId: validacion.unidadDestinoId, seguimientoActualId: seguimientoId,
      }, username);

      return { tipo, seguimientoId, codigoDerivacion, codigoRequerimiento: r.codigo ?? codigoRequerimiento, estadoDestino: validacion.estadoDestinoCodigo, unidadDestinoId: validacion.unidadDestinoId };
    });
  }

  private async derivarMasivoConValidacion(dto: DerivarMasivoDto, usuarioId: number, username: string, tipo: 'INICIAL' | 'POSTERIOR') {
    const esAdmin = await this.requerimientoRepository.esAdministrador(usuarioId);
    const flujoId = await this.obtenerFlujoId();

    return transaction(async (client) => {
      const requerimientos: Array<{ id: number; codigo: string | null; estadoCodigo: string; unidadActualId: number | null; seguimientoActualId: number | null; unidadEfectivaId: number; }> = [];

      for (const reqId of dto.requerimientoIds) {
        const r = await this.requerimientoRepository.obtenerPorId(reqId);
        if (!r) throw new NotFoundError(`Requerimiento ${reqId} no encontrado`);

        if (tipo === 'INICIAL') {
          if (r.estadoCodigo !== 'REGISTRADO') throw new ValidationError(`Requerimiento ${reqId}: la derivación inicial solo aplica a REGISTRADO. Estado actual: '${r.estadoCodigo}'`);
          if (r.seguimientoActualId !== null) throw new ValidationError(`Requerimiento ${reqId}: ya tiene seguimientos previos`);
        } else {
          if (r.estadoCodigo === 'REGISTRADO') throw new ValidationError(`Requerimiento ${reqId}: los REGISTRADOS van por la bandeja de requerimiento`);
        }

        const unidadEfectiva = esAdmin ? { unidadId: r.unidadActualId ?? r.unidadSolicitanteId } : await this.obtenerUnidadEfectiva(usuarioId, r.id);
        if (r.unidadActualId !== unidadEfectiva.unidadId) throw new ForbiddenError(`El requerimiento ${reqId} no está en su unidad`);
        if (['FINALIZADO', 'ANULADO', 'RECHAZADO', 'CONCLUIDO'].includes(r.estadoCodigo)) throw new ValidationError(`Requerimiento ${reqId}: estado '${r.estadoCodigo}' no derivable`);

        const validacion = await this.flujoService.validarTransicion(FLUJO_CODIGO, unidadEfectiva.unidadId, r.estadoCodigo, 'DERIVAR');
        if (!validacion.valida) throw new ValidationError(`Requerimiento ${reqId}: ${validacion.motivo ?? 'transición no permitida'}`);
        
        if (validacion.unidadDestinoId === unidadEfectiva.unidadId) {
          throw new ValidationError(`Requerimiento ${reqId}: no se puede derivar a su misma unidad actual.`);
        }

        if (validacion.unidadDestinoId) {
          const uOrigen = await client.query<{ codigo: string }>(`SELECT codigo FROM ${this.schema}.unidad_organizacional WHERE id = $1`, [unidadEfectiva.unidadId]);
          const uDestino = await client.query<{ codigo: string }>(`SELECT codigo FROM ${this.schema}.unidad_organizacional WHERE id = $1`, [validacion.unidadDestinoId]);
          
          if (uOrigen.rows[0]?.codigo === 'DGAL' && uDestino.rows[0]?.codigo === 'OM') {
            const contrato = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this.schema}.contrato WHERE requerimiento_id = $1`, [r.id]);
            if (parseInt(contrato.rows[0].count, 10) === 0) {
              throw new ValidationError(`Requerimiento ${reqId}: no se puede derivar a Oficina Mayor sin un contrato elaborado.`);
            }
          }
        }

        requerimientos.push({ id: r.id, codigo: r.codigo, estadoCodigo: r.estadoCodigo, unidadActualId: r.unidadActualId, seguimientoActualId: r.seguimientoActualId, unidadEfectivaId: unidadEfectiva.unidadId });
      }

      const codigoDerivacion = generarCodigoDerivacion();
      const codigoRequerimientoLote = generarCodigoRequerimiento();
      const resultados: Array<{ requerimientoId: number; seguimientoId: number; codigoRequerimiento: string; }> = [];

      for (const r of requerimientos) {
        const validacion = await this.flujoService.validarTransicion(FLUJO_CODIGO, r.unidadEfectivaId, r.estadoCodigo, 'DERIVAR');
        const siguiente = await this.repository.siguienteNumero(client, r.id);

        const seguimientoId = await this.repository.crear(client, {
          requerimientoId: r.id, numeroSeguimiento: siguiente, seguimientoOrigenId: r.seguimientoActualId, flujoId,
          unidadOrigenId: r.unidadEfectivaId, usuarioEnvio: username, unidadDestinoId: validacion.unidadDestinoId!,
          estadoCodigo: validacion.estadoDestinoCodigo!, accionCodigo: 'DERIVAR', tipoMovimientoCodigo: validacion.tipoMovimientoCodigo!,
          resultadoCodigo: validacion.resultadoCodigo ?? null, codigoDerivacion, unidadResponsableObservacionId: null,
          fechaObservacion: null, fechaSubsanacion: null, usuarioRecepcion: null, fechaRecepcion: null, usuarioRevision: null,
          fechaInicioRevision: null, fechaFinRevision: null, usuarioFinalizacion: null, fechaFinalizacion: null,
          observaciones: dto.observaciones ?? null, motivo: dto.motivo ?? null,
        }, username);

        const codigoRequerimiento = r.codigo ?? codigoRequerimientoLote;

        await this.requerimientoRepository.actualizarPorAccion(client, r.id, {
          codigo: r.codigo === null ? codigoRequerimientoLote : undefined, codigoGrupo: codigoRequerimientoLote,
          estadoCodigo: validacion.estadoDestinoCodigo!, unidadActualId: validacion.unidadDestinoId!, seguimientoActualId: seguimientoId,
        }, username);

        resultados.push({ requerimientoId: r.id, seguimientoId, codigoRequerimiento });
      }

      return { tipo, operacion: tipo === 'INICIAL' ? 'DERIVACION_MASIVA_INICIAL' : 'DERIVACION_MASIVA_POSTERIOR', codigoRequerimientoLote, codigoDerivacion, codigoUnico: true, totalRequerimientos: resultados.length, requerimientos: resultados, mensaje: `Se derivaron ${resultados.length} requerimiento(s) con el código único ${codigoRequerimientoLote} (derivación ${codigoDerivacion}).` };
    });
  }

  private async ejecutarAccionSimple(params: {
    accion: AccionSimple; requerimientoId: number; usuarioId: number; username: string;
    observaciones: string | null; motivo: string | null; 
    unidadResponsableObservacionId?: number | null;
    resultadoFinalCodigo?: string | null; tipoFinalizacionCodigo?: string | null;
  }) {
    const esAdmin = await this.requerimientoRepository.esAdministrador(params.usuarioId);
    const flujoId = await this.obtenerFlujoId();

    return transaction(async (client) => {
      const r = await this.requerimientoRepository.obtenerPorId(params.requerimientoId);
      if (!r) throw new NotFoundError('Requerimiento no encontrado');

      const unidadEfectiva = esAdmin ? { unidadId: r.unidadActualId ?? r.unidadSolicitanteId } : await this.obtenerUnidadEfectiva(params.usuarioId, r.id);
      if (r.unidadActualId !== unidadEfectiva.unidadId) throw new ForbiddenError('La acción solo puede ejecutarse desde la unidad que tiene el requerimiento');

      const validacion = await this.flujoService.validarTransicion(FLUJO_CODIGO, unidadEfectiva.unidadId, r.estadoCodigo, params.accion);
      if (!validacion.valida) throw new ValidationError(validacion.motivo ?? 'Transición no permitida');
      if (validacion.requiereObservacion && !params.observaciones) throw new ValidationError(`La acción ${params.accion} requiere observaciones`);
      if (validacion.requiereMotivo && !params.motivo) throw new ValidationError(`La acción ${params.accion} requiere motivo`);

      let unidadDestinoFinal = validacion.unidadDestinoId;
      let unidadResponsableObsFinal = params.unidadResponsableObservacionId;

      if (params.accion === 'OBSERVAR') {
        const uOrigen = await client.query<{ codigo: string }>(
          `SELECT codigo FROM ${this.schema}.unidad_organizacional WHERE id = $1`,
          [unidadEfectiva.unidadId]
        );
        
        if (uOrigen.rows[0]?.codigo === 'OM') {
          const galUnit = await client.query<{ id: number }>(
            `SELECT id FROM ${this.schema}.unidad_organizacional WHERE codigo = 'DGAL'`
          );
          
          if (galUnit.rows.length > 0) {
            unidadDestinoFinal = galUnit.rows[0].id;
            unidadResponsableObsFinal = galUnit.rows[0].id;
          }
        }
      }

      const ahora = new Date();
      const siguiente = await this.repository.siguienteNumero(client, r.id);
      const esRecepcion = params.accion === 'RECIBIR';
      const esObservacion = params.accion === 'OBSERVAR';
      const esSubsanacion = params.accion === 'SUBSANAR';
      const esFinalizacion = params.accion === 'FINALIZAR' || params.accion === 'RECHAZAR' || params.accion === 'NO_SUBSANADO' || validacion.permiteFinalizacion === true;

      const seguimientoId = await this.repository.crear(client, {
        requerimientoId: r.id, numeroSeguimiento: siguiente, seguimientoOrigenId: r.seguimientoActualId, flujoId,
        unidadOrigenId: unidadEfectiva.unidadId, usuarioEnvio: params.username, unidadDestinoId: unidadDestinoFinal ?? null,
        estadoCodigo: validacion.estadoDestinoCodigo!, accionCodigo: params.accion, tipoMovimientoCodigo: validacion.tipoMovimientoCodigo!,
        resultadoCodigo: validacion.resultadoCodigo ?? null, codigoDerivacion: null, unidadResponsableObservacionId: unidadResponsableObsFinal ?? null,
        fechaObservacion: esObservacion ? ahora : null, fechaSubsanacion: esSubsanacion ? ahora : null,
        usuarioRecepcion: esRecepcion ? params.username : null, fechaRecepcion: esRecepcion ? ahora : null,
        usuarioRevision: null, fechaInicioRevision: null, fechaFinRevision: null,
        usuarioFinalizacion: esFinalizacion ? params.username : null, fechaFinalizacion: esFinalizacion ? ahora : null,
        observaciones: params.observaciones, motivo: params.motivo,
      }, params.username);

      await this.requerimientoRepository.actualizarPorAccion(client, r.id, {
        estadoCodigo: validacion.estadoDestinoCodigo!, unidadActualId: unidadDestinoFinal ?? r.unidadActualId, seguimientoActualId: seguimientoId,
      }, params.username);

      if (esFinalizacion && validacion.permiteFinalizacion) {
        await client.query(
          `UPDATE ${this.schema}.requerimiento
              SET resultado_final_codigo = COALESCE($1, resultado_final_codigo), tipo_finalizacion_codigo = COALESCE($2, tipo_finalizacion_codigo),
                  fecha_finalizacion = COALESCE(fecha_finalizacion, CURRENT_TIMESTAMP), usuario_finalizacion = COALESCE(usuario_finalizacion, $3),
                  observacion_final = COALESCE($4, observacion_final)
            WHERE id = $5`,
          [params.resultadoFinalCodigo ?? null, params.tipoFinalizacionCodigo ?? null, params.username, params.observaciones, r.id]
        );
      }

      return { seguimientoId, estadoDestino: validacion.estadoDestinoCodigo, unidadDestinoId: unidadDestinoFinal ?? null };
    });
  }

  private async obtenerUnidadEfectiva(usuarioId: number, requerimientoId: number): Promise<{ unidadId: number }> {
    const esAdmin = await this.requerimientoRepository.esAdministrador(usuarioId);
    if (esAdmin) {
      const r = await this.requerimientoRepository.obtenerPorId(requerimientoId);
      if (!r || !r.unidadActualId) throw new ForbiddenError('El requerimiento no tiene unidad actual asignada');
      return { unidadId: r.unidadActualId };
    }
    const u = await this.requerimientoRepository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) throw new ForbiddenError('El usuario no tiene una unidad asignada');
    return { unidadId: u.unidad_id };
  }

  private async obtenerFlujoId(): Promise<number> {
    const r = await query<{ id: number }>(`SELECT id FROM ${this.schema}.flujo WHERE codigo = $1 AND estado = 'ACT'`, [FLUJO_CODIGO]);
    if (r.rows.length === 0) throw new NotFoundError(`Flujo '${FLUJO_CODIGO}' no encontrado o inactivo`);
    return r.rows[0].id;
  }

  private fechaISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private async calcularDiaHabilAnterior(fechaStr: string, client?: any): Promise<string> {
    const validarHabiles = parametroService.getBool('VALIDAR_DIAS_HABILES_CONTRATO', true);
    
    const d = new Date(fechaStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);

    if (!validarHabiles) {
      return d.toISOString().split('T')[0];
    }

    const queryFn = client ? client.query.bind(client) : query;
    const feriadosRes = await queryFn(`SELECT fecha::text FROM ${this.schema}.feriado WHERE estado = 'ACT'`);
    const feriados = new Set(feriadosRes.rows.map((r: any) => r.fecha));

    while (true) {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const esFinDeSemana = d.getUTCDay() === 0 || d.getUTCDay() === 6;
      const esFeriado = feriados.has(dateStr);

      if (!esFinDeSemana && !esFeriado) {
        return dateStr;
      }
      d.setUTCDate(d.getUTCDate() - 1);
    }
  }

  async obtenerEstadisticas(usuarioId: number) {
    const u = await this.requerimientoRepository.obtenerUnidadDeUsuario(usuarioId);
    if (!u?.unidad_id) return {}; 
    return this.repository.obtenerEstadisticas(u.unidad_id);
  }

  async obtenerChecklist(requerimientoId: number) {
    const r = await this.requerimientoRepository.obtenerPorId(requerimientoId);
    if (!r) throw new NotFoundError('Requerimiento no encontrado');
    
    const persona = await query<PersonaGeneroRow>(
      `SELECT genero FROM ${this.schema}.persona WHERE id = $1`, 
      [r.personaId]
    );
    const genero = persona.rows[0]?.genero || 'T';

    const reglas = await query<RequisitoReglaRow>(`
      SELECT DISTINCT ON (rr.requisito_codigo) 
             rr.requisito_codigo AS req_codigo, 
             cd.nombre 
      FROM ${this.schema}.requisito_regla rr
      JOIN ${this.schema}.catalogo_detalle cd ON cd.codigo = rr.requisito_codigo
      WHERE rr.tipo_requerimiento_codigo = $1 
        AND (rr.genero_aplica = 'T' OR rr.genero_aplica = $2)
        AND rr.estado = 'ACT'
      ORDER BY rr.requisito_codigo
    `, [r.tipoRequerimiento || 'NUEVO', genero]);

    const verificados = await query<RequerimientoRequisitoRow>(`
      SELECT requisito_codigo, verificado, observaciones 
      FROM ${this.schema}.requerimiento_requisito 
      WHERE requerimiento_id = $1
    `, [requerimientoId]);

    const checklist = reglas.rows.map((regla: RequisitoReglaRow) => {
      const v = verificados.rows.find(
        (v: RequerimientoRequisitoRow) => v.requisito_codigo === regla.req_codigo
      );
      
      return {
        codigo: regla.req_codigo,
        nombre: regla.nombre,
        verificado: v?.verificado || false,
        observaciones: v?.observaciones || null
      };
    });

    return checklist;
  }

  async guardarChecklist(
    requerimientoId: number, 
    requisitos: Array<{ codigo: string; verificado: boolean; observaciones?: string | null }>, 
    username: string
  ) {
    return transaction(async (client) => {
      for (const req of requisitos) {
        await client.query(`
          INSERT INTO ${this.schema}.requerimiento_requisito 
            (requerimiento_id, requisito_codigo, verificado, usuario_verificacion, fecha_verificacion, observaciones)
          VALUES ($1, $2, $3, $4, NOW(), $5)
          ON CONFLICT (requerimiento_id, requisito_codigo) 
          DO UPDATE SET 
            verificado = EXCLUDED.verificado,
            usuario_verificacion = EXCLUDED.usuario_verificacion,
            fecha_verificacion = NOW(),
            observaciones = EXCLUDED.observaciones
        `, [requerimientoId, req.codigo, req.verificado, username, req.observaciones || null]);
      }
      return { message: 'Checklist actualizado correctamente' };
    });
  }
}