import { Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(
    res,
    'RESOURCE_NOT_FOUND',
    `La ruta ${req.method} ${req.originalUrl} no existe en este servidor.`,
    404
  );
}
