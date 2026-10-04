import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Manejo de errores de validación de Zod (robusto ante múltiples instancias de Zod)
  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    const issues = err.issues || err.errors || [];
    const details = issues.map((e: any) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
      message: e.message,
    }));
    return sendError(
      res,
      'VALIDATION_ERROR',
      issues[0]?.message || 'Error de validación en los datos enviados',
      400,
      details
    );
  }

  // Manejo de errores de dominio/operacionales (AuthError, OrganizationError, etc.)
  if (err && typeof err.statusCode === 'number' && typeof err.code === 'string') {
    return sendError(res, err.code, err.message, err.statusCode);
  }

  // Logging interno de seguridad (evita imprimir contraseñas o tokens)
  console.error('[Unhandled Error]:', err?.name, err?.message);

  if (env.NODE_ENV === 'development') {
    return sendError(
      res,
      'INTERNAL_SERVER_ERROR',
      err?.message || 'Ha ocurrido un error inesperado en el servidor',
      500,
      { stack: err?.stack }
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

