import { Request, Response, NextFunction } from 'express';
import { PersonaService } from '../services/persona.service';

const service = new PersonaService();

export class PersonaController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const search = req.query.search ? String(req.query.search) : undefined;
      const result = await service.listar({ page, limit, search });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crear(req.body, req.user!.username);
      res.status(201).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizar(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.eliminar(Number(req.params.id), req.user!.username);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }
}