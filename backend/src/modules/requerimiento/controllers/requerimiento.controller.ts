import { Request, Response, NextFunction } from 'express';
import { RequerimientoService } from '../services/requerimiento.service';
import { ListarRequerimientosDto } from '../dto/requerimiento.dto';
import { ValidationError } from '../../../shared/errors/AppError';

const service = new RequerimientoService();

export class RequerimientoController {
  // ═══════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crear(
        req.body,
        req.user!.usuarioId,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listar(
        req.query as unknown as ListarRequerimientosDto,
        req.user!.usuarioId
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new ValidationError('El ID del requerimiento es inválido');
      }
      
      const result = await service.obtenerPorId(id, req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new ValidationError('El ID del requerimiento es inválido');
      }

      const result = await service.actualizar(
        id,
        req.body,
        req.user!.usuarioId,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BANDEJAS
  // ═══════════════════════════════════════════════════════════════════════

  async bandeja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await service.bandeja(req.user!.usuarioId, page, limit);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /api/requerimientos/bandeja-derivar
   * Solo REGISTRADOS en la unidad del usuario (pendientes de primera derivación).
   */
  async bandejaDerivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.bandejaDerivar(req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITARIOS
  // ═══════════════════════════════════════════════════════════════════════

  async buscarPersona(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tipoDocumento = String(req.query.tipoDocumento ?? '').trim();
      const numeroDocumento = String(req.query.numeroDocumento ?? '').trim();
      const complementoRaw = req.query.complemento;
      const complemento = complementoRaw
        ? String(
            Array.isArray(complementoRaw) ? complementoRaw[0] : complementoRaw
          ).trim()
        : null;

      if (!tipoDocumento || !numeroDocumento) {
        throw new ValidationError('tipoDocumento y numeroDocumento son obligatorios');
      }

      const result = await service.buscarPersona(
        tipoDocumento,
        numeroDocumento,
        complemento
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DERIVACIÓN INICIAL (desde bandeja de requerimiento)
  // ═══════════════════════════════════════════════════════════════════════

  async derivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.derivar(
        Number(req.params.id),
        req.body,
        req.user!.usuarioId,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async derivarMasivo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.derivarMasivo(
        req.body,
        req.user!.usuarioId,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }


    /**
   * GET /api/requerimientos/persona/:personaId/activo
   * Devuelve si la persona tiene un proceso activo (requerimiento o contrato)
   * y, si lo tiene, sus datos completos.
   */
    async obtenerProcesoActivo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const personaId = Number(req.params.personaId);
      const excludeId = req.query.excludeRequerimientoId ? Number(req.query.excludeRequerimientoId) : undefined;

      const result = await service.obtenerProcesoActivoPorPersona(personaId, req.user!.usuarioId, excludeId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

    async obtenerEstadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerEstadisticas(req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}