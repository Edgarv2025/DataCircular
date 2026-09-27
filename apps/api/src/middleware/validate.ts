import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

/**
 * Middleware genérico para validar el cuerpo (body) de la petición usando esquemas Zod.
 * Utiliza comprobación segura de ZodError para evitar problemas de identidad de prototipos en monorepos.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err: unknown) {
      const isZodError =
        err instanceof ZodError ||
        (Boolean(err) &&
          typeof err === 'object' &&
          (err as { name?: string }).name === 'ZodError');

      if (isZodError) {
        const zodErr = err as ZodError;
        const issues = zodErr.issues || zodErr.errors || [];
        const formattedErrors = issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        sendError(
          res,
          'VALIDATION_ERROR',
          'Los datos enviados no cumplen con los requisitos de validación',
          400,
          formattedErrors
        );
        return;
      }

      sendError(res, 'BAD_REQUEST', 'Error al procesar los datos de entrada', 400);
    }
  };
}
