import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip;
      const userAgent = req.get('user-agent');
      const result = await authService.login(req.body, ip, userAgent);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cambiarPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.cambiarPassword(req.user!.usuarioId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.logout(req.user!.usuarioId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async miPerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.miPerfil(req.user!.usuarioId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refrescarToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const result = await authService.refrescarToken(
      req.body.refreshToken,
      ip,
      userAgent
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
}