import { Request, Response, NextFunction } from 'express';
import { authService, AuthError } from './auth.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Usuario registrado exitosamente', 201);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Inicio de sesión exitoso', 200);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function logoutController(
  _req: Request,
  res: Response
): Promise<void> {
  // En un esquema con JWT sin estado, el cliente elimina los tokens de su almacenamiento seguro (SecureStore).
  // Se provee el endpoint para registrar el evento y permitir invalidación del lado del cliente.
  sendSuccess(res, null, 'Sesión cerrada exitosamente', 200);
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, { tokens }, 'Tokens renovados exitosamente', 200);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}
