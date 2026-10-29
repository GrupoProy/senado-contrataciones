import { Request, Response, NextFunction } from 'express';
import { PermisoService } from '../services/permiso.service';

const service = new PermisoService();

export class PermisoController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = {
        modulo: req.query.modulo ? String(req.query.modulo) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      };
      const result = await service.listar(filtros);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async agrupados(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.agrupados();
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crear(req.body, req.user!.username);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.cambiarEstado(
        Number(req.params.id),
        req.body.estado,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}