import { Request, Response, NextFunction } from 'express';
import { CargoService } from '../services/cargo.service';
import { ListarCargosDto } from '../dto/cargo.dto';

const service = new CargoService();

export class CargoController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listar(req.query as unknown as ListarCargosDto);
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