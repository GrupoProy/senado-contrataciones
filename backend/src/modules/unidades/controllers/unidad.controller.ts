import { Request, Response, NextFunction } from 'express';
import { UnidadService } from '../services/unidad.service';

const service = new UnidadService();

export class UnidadController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const soloActivas = req.query.soloActivas === 'true';
      const result = await service.listar(soloActivas);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async arbol(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listarComoArbol();
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

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizar(Number(req.params.id), req.body, req.user!.username);
      res.json({ success: true, data: result });
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