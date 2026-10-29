import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
const service = new DashboardService();

export class DashboardController {
  // ✅ Cambiamos 'req' por '_req'
  async obtenerStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.obtenerEstadisticas();
      res.json({ success: true, data: result });
    } catch (e) { 
      next(e); 
    }
  }
}