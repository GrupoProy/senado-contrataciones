import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';

export class JobController {
  async ejecutarVencimientoContratos(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await jobService.ejecutarVencimientoContratos();
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async listarEjecuciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proceso = req.query.proceso ? String(req.query.proceso) : undefined;
      const result = await jobService.listarEjecuciones(proceso);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}