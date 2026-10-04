import { Request, Response, NextFunction } from 'express';
import { organizationsRepository } from './organizations.repository';
import { sendError } from '../../utils/apiResponse';

declare global {
  namespace Express {
    interface Request {
      orgMembership?: {
        id: string;
        organizationId: string;
        userId: string;
        roleId: string;
        roleName: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Middleware que verifica que el usuario autenticado sea miembro activo
 * de la organización especificada en req.params.id (o req.params.orgId).
 * Los administradores de plataforma (UserRole === 'ADMIN') tienen bypass automático.
 */
export async function requireOrgMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'No autenticado', 401);
    return;
  }

  const orgId = req.params.id || req.params.orgId;
  if (!orgId) {
    sendError(res, 'BAD_REQUEST', 'Identificador de organización no proporcionado en la ruta', 400);
    return;
  }

  // Si es administrador global de la plataforma, tiene acceso concedido
  if (req.user.role === 'ADMIN') {
    req.orgMembership = {
      id: 'platform-admin',
      organizationId: orgId,
      userId: req.user.id,
      roleId: 'platform-admin-role',
      roleName: 'PLATFORM_ADMIN',
      permissions: ['*'], // Permisos globales
    };
    next();
    return;
  }

  const membership = await organizationsRepository.findMember(orgId, req.user.id);

  if (!membership || membership.status !== 'ACTIVE') {
    sendError(
      res,
      'FORBIDDEN',
      'No perteneces a esta organización o tu membresía no está activa',
      403
    );
    return;
  }

  const permissions = membership.role.permissions.map((rp) => rp.permission.code);

  req.orgMembership = {
    id: membership.id,
    organizationId: membership.organizationId,
    userId: membership.userId,
    roleId: membership.roleId,
    roleName: membership.role.name,
    permissions,
  };

  next();
}

/**
 * Middleware que valida que el miembro posea un permiso específico en la organización.
 */
export function requireOrgPermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.orgMembership) {
      sendError(res, 'FORBIDDEN', 'Membresía no validada en la organización', 403);
      return;
    }

    // Platform admin bypass
    if (req.orgMembership.permissions.includes('*')) {
      next();
      return;
    }

    if (!req.orgMembership.permissions.includes(permissionCode)) {
      sendError(
        res,
        'FORBIDDEN',
        `No posees el permiso requerido (${permissionCode}) en esta organización`,
        403
      );
      return;
    }

    next();
  };
}
