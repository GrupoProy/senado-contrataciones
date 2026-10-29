import { Request, Response, NextFunction } from 'express';
import { SeguimientoService } from '../services/seguimiento.service';
import { ValidationError } from '../../../shared/errors/AppError'; 

const service = new SeguimientoService();

// ✅ Asegúrate de que tenga la palabra 'export' antes de 'class'
export class SeguimientoController {
  // ═══════════════════════════════════════════════════════════════════════
  // DERIVACIÓN POSTERIOR (bandeja de seguimiento)
  // ═══════════════════════════════════════════════════════════════════════

  async derivarPosterior(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.derivarPosterior(
        req.body,
        req.user!.usuarioId,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async derivarMasivoPosterior(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.derivarMasivoPosterior(
        req.body,
        req.user!.usuarioId,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES DEL FLUJO
  // ═══════════════════════════════════════════════════════════════════════

  async recibir(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.recibir(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async iniciarRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.iniciarRevision(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async concluirRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.concluirRevision(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async elaborarContrato(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.elaborarContrato(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async enviarFirma(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.enviarFirma(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async registrarFirma(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.registrarFirma(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async observar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.observar(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async subsanar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.subsanar(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async aprobar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.aprobar(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async finalizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.finalizar(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async rechazar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.rechazar(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async noSubsanado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.noSubsanado(req.body, req.user!.usuarioId, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════════════════════

  async historial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 50);
      const result = await service.historial(Number(req.params.requerimientoId), req.user!.usuarioId, page, limit);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

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

  async listarDerivables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listarDerivables(req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new ValidationError('El ID del seguimiento es inválido');
      }
      const result = await service.obtenerPorId(id, req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

    // ═══════════════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════

  async obtenerEstadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerEstadisticas(req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

    async obtenerChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerChecklist(Number(req.params.requerimientoId));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async guardarChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.guardarChecklist(Number(req.params.requerimientoId), req.body.requisitos, req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}