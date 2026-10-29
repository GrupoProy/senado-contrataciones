import { Request, Response, NextFunction } from 'express';
import { CatalogoService } from '../services/catalogo.service';
import { ListarCatalogosDto } from '../dto/catalogo.dto';

const service = new CatalogoService();

export class CatalogoController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.listar(req.query as unknown as ListarCatalogosDto);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

 async obtenerPorCodigo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const codigo = String(req.params.codigo).toUpperCase();
    const result = await service.obtenerPorCodigo(codigo);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
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

  async crearDetalle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.crearDetalle(
        Number(req.params.id),
        req.body,
        req.user!.username
      );
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async actualizarDetalle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.actualizarDetalle(
        Number(req.params.detalleId),
        req.body,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async cambiarEstadoDetalle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.cambiarEstadoDetalle(
        Number(req.params.detalleId),
        req.body.estado,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}