import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Logging interno de seguridad (evita imprimir contraseñas o tokens)
  console.error('[Unhandled Error]:', err.name, err.message);

  if (env.NODE_ENV === 'development') {
    return sendError(
      res,
      'INTERNAL_SERVER_ERROR',
      err.message || 'Ha ocurrido un error inesperado en el servidor',
      500,
      { stack: err.stack }
    );
  }

  // En producción nunca revelar trazas ni mensajes internos
  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'Ha ocurrido un error interno en el servidor. Por favor intenta más tarde.',
    500
  );
}
