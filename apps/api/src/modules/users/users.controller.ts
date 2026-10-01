import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { AuthError } from '../auth/auth.service';

export async function listUsersController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await usersService.listUsers();
    sendSuccess(res, users, 'Usuarios obtenidos exitosamente');
  } catch (err: unknown) {
    next(err);
  }
}

export async function adminCreateUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.adminCreateUser(req.body);
    sendSuccess(res, user, 'Usuario creado exitosamente', 201);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function adminDeleteUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.adminDeleteUser(req.user!.id, req.params.id);
    sendSuccess(res, user, 'Usuario desactivado exitosamente');
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.getMe(req.user!.id);
    sendSuccess(res, user, 'Perfil de usuario obtenido exitosamente');
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function updateMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await usersService.updateMe(req.user!.id, req.body);
    sendSuccess(res, updated, 'Perfil actualizado exitosamente');
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function deleteMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deactivated = await usersService.deleteMe(req.user!.id);
    sendSuccess(
      res,
      deactivated,
      'Cuenta desactivada exitosamente. Tu sesión ya no será válida.'
    );
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function getUserByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const publicProfile = await usersService.getPublicProfile(req.params.id);
    sendSuccess(res, publicProfile, 'Perfil público de usuario obtenido exitosamente');
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

export async function adminUpdateUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await usersService.adminUpdateUser(req.params.id, req.body);
    sendSuccess(res, updated, 'Usuario actualizado administrativamente');
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      sendError(res, err.code, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}
