import { Request, Response, NextFunction } from 'express';
import { parametroService } from '../services/parametro.service';

export class ParametroController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grupoRaw = req.query.grupo;
      const grupo = Array.isArray(grupoRaw)
        ? String(grupoRaw[0])
        : grupoRaw !== undefined
          ? String(grupoRaw)
          : undefined;

      const result = await parametroService.listar(grupo);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await parametroService.actualizar(
        String(req.params.clave),
        String(req.body.valor),
        req.user!.username
      );
      res.json({ success: true, data: { message: 'Parámetro actualizado' } });
    } catch (e) {
      next(e);
    }
  }

  async recargarCache(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await parametroService.cargarCache();
      res.json({ success: true, data: { message: 'Caché de parámetros recargada' } });
    } catch (e) {
      next(e);
    }
  }
}