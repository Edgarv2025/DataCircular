import { Request, Response, NextFunction } from 'express';
import { telemetryService } from '../modules/admin/telemetry.service';

/**
 * Middleware para capturar métricas de conexión en tiempo real:
 * - Duración de la solicitud (latencia de respuesta de la API)
 * - Código de estado HTTP
 * - Sesión del cliente (por token/usuario o IP)
 */
export function telemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = Math.max(1, Math.round(performance.now() - start));
    const clientId =
      (req as any).user?.id ||
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'anonymous-client';

    telemetryService.recordRequest({
      timestamp: Date.now(),
      statusCode: res.statusCode,
      durationMs,
      path: req.baseUrl ? `${req.baseUrl}${req.path}` : req.path,
      clientId: String(clientId),
    });
  });

  next();
}
