import { Request, Response, NextFunction } from 'express';
import { AuditoriaService } from '../services/auditoria.service';
import type { ListarAuditoriaDto } from '../dto/auditoria.dto';

const service = new AuditoriaService();

export class AuditoriaController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listar(req.query as unknown as ListarAuditoriaDto);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }
}