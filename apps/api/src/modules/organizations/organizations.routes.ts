import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { requireOrgMember, requireOrgPermission } from './organizations.middleware';
import { organizationsController } from './organizations.controller';

const organizationsRouter = Router();

// Todas las rutas requieren token de autenticación válido
organizationsRouter.use(authenticateToken);

// Consulta de roles de sistema y permisos
organizationsRouter.get('/roles/available', organizationsController.listRoles);

// CRUD básico de Organizaciones
organizationsRouter.post('/', organizationsController.create);
organizationsRouter.get('/', organizationsController.list);
organizationsRouter.get('/:id', organizationsController.getById);

organizationsRouter.patch(
  '/:id',
  requireOrgMember,
  requireOrgPermission('org:update'),
  organizationsController.update
);

organizationsRouter.delete(
  '/:id',
  requireOrgMember,
  requireOrgPermission('org:delete'),
  organizationsController.delete
);

// Gestión de Membresías y Miembros
organizationsRouter.get(
  '/:id/members',
  requireOrgMember,
  requireOrgPermission('members:read'),
  organizationsController.listMembers
);

organizationsRouter.post(
  '/:id/members',
  requireOrgMember,
  requireOrgPermission('members:invite'),
  organizationsController.addMember
);

organizationsRouter.patch(
  '/:id/members/:memberId',
  requireOrgMember,
  requireOrgPermission('members:update'),
  organizationsController.updateMemberRole
);

organizationsRouter.delete(
  '/:id/members/:memberId',
  requireOrgMember,
  requireOrgPermission('members:remove'),
  organizationsController.removeMember
);

// Verificación y Certificación Institucional
organizationsRouter.post(
  '/:id/verification',
  requireOrgMember,
  requireOrgPermission('verification:request'),
  organizationsController.requestVerification
);

organizationsRouter.post(
  '/:id/verification/review',
  requireRole('ADMIN'),
  organizationsController.reviewVerification
);

export { organizationsRouter };
