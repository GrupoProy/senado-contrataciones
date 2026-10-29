import { Request, Response, NextFunction } from 'express';
import { SenadorService } from '../services/senador.service';
import type { ListarSenadoresDto } from '../dto/senador.dto';

const service = new SenadorService();

export class SenadorController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listar(req.query as unknown as ListarSenadoresDto);
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
      const result = await service.crear(req.body, req.user!.usuarioId);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizar(Number(req.params.id), req.body, req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.cambiarEstado(Number(req.params.id), req.body.estado, req.user!.usuarioId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.eliminar(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}