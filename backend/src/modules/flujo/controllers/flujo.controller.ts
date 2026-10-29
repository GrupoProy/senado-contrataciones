import { Request, Response, NextFunction } from 'express';
import { FlujoService } from '../services/flujo.service';
import {
  ListarFlujosDto,
  ListarTransicionesDto,
  ConsultarAccionesDto,
  ValidarTransicionDto,
} from '../dto/flujo.dto';

const service = new FlujoService();

export class FlujoController {
  // ═══════════════════════════════════════════════════════════════════════
  // FLUJOS
  // ═══════════════════════════════════════════════════════════════════════

  async listarFlujos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listarFlujos(req.query as unknown as ListarFlujosDto);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async obtenerFlujoPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerFlujoPorId(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async obtenerFlujoPorCodigo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerFlujoPorCodigo(String(req.params.codigo));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async crearFlujo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crearFlujo(req.body, req.user!.username);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async actualizarFlujo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizarFlujo(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async cambiarEstadoFlujo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.cambiarEstadoFlujo(
        Number(req.params.id),
        req.body.estado,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSICIONES
  // ═══════════════════════════════════════════════════════════════════════

  async listarTransiciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listarTransiciones(
        Number(req.params.flujoId),
        req.query as unknown as ListarTransicionesDto
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async crearTransicion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crearTransicion(
        Number(req.params.flujoId),
        req.body,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async actualizarTransicion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizarTransicion(
        Number(req.params.transicionId),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async cambiarEstadoTransicion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.cambiarEstadoTransicion(
        Number(req.params.transicionId),
        req.body.estado,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS DE CONTEXTO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * GET /api/flujos/:codigo/acciones-disponibles?unidadId=2&estadoActualCodigo=REGISTRADO
   * Devuelve las acciones que puede ejecutar la unidad en ese estado.
   */
  async listarAccionesDisponibles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto = req.query as unknown as ConsultarAccionesDto;
      const result = await service.listarAccionesDisponibles(
        String(req.params.codigo),
        dto.unidadId,
        dto.estadoActualCodigo ?? null
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  /**
   * POST /api/flujos/:codigo/validar-transicion
   * Body: { unidadId, estadoActualCodigo, accionCodigo }
   * Responde si la transición es válida y qué reglas debe cumplir el request.
   */
  async validarTransicion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as ValidarTransicionDto;
      const result = await service.validarTransicion(
        String(req.params.codigo),
        dto.unidadId,
        dto.estadoActualCodigo ?? null,
        dto.accionCodigo
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}