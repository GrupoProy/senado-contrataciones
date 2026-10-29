import { Request, Response, NextFunction } from 'express';
import { MatrizService } from '../services/matriz.service';

const service = new MatrizService();

export class MatrizController {
  async listarRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listarRolesConResumen();
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async obtenerMatrizRol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerMatrizRol(Number(req.params.rolId));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async sincronizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.sincronizar(
        Number(req.params.rolId),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async miMatriz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerMatrizUsuario(req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }
}