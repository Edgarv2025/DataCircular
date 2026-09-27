import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { usersRepository } from '../modules/users/users.repository';
import { sendError } from '../utils/apiResponse';
import { SafeUserDto, UserRole } from '@data-circular/shared';

// Extender la interfaz Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: SafeUserDto;
    }
  }
}

/**
 * Middleware que verifica el token JWT Bearer en el encabezado Authorization.
 * Protege las rutas privadas requiriendo una sesión válida y un usuario activo.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    sendError(res, 'UNAUTHORIZED', 'Cabecera de autorización no proporcionada', 401);
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    sendError(
      res,
      'UNAUTHORIZED',
      'Formato de token inválido. Debe ser: Bearer <token>',
      401
    );
    return;
  }

  const token = parts[1];

  try {
    const payload = verifyAccessToken(token);

    // Verificar que el usuario exista en la BD y no haya sido desactivado
    const user = await usersRepository.findById(payload.sub, false);
    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'El usuario asociado al token no existe o ha sido desactivado', 401);
      return;
    }

    if (user.status !== 'ACTIVE') {
      sendError(res, 'FORBIDDEN', 'La cuenta de usuario no está activa', 403);
      return;
    }

    req.user = user;
    next();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Token inválido';
    sendError(res, 'UNAUTHORIZED', `Token inválido o expirado: ${errorMessage}`, 401);
  }
}

/**
 * Middleware de autorización por rol.
 * Comprueba que el usuario autenticado posea alguno de los roles requeridos.
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'No autenticado', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        'FORBIDDEN',
        'No tienes permisos suficientes para realizar esta acción administrativa',
        403
      );
      return;
    }

    next();
  };
}
