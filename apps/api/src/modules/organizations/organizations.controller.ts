import { Request, Response, NextFunction } from 'express';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  requestVerificationSchema,
  reviewVerificationSchema,
} from '@data-circular/shared';
import { organizationsService } from './organizations.service';
import { sendSuccess } from '../../utils/apiResponse';

export class OrganizationsController {
  /**
   * POST /api/v1/organizations
   * Crea una nueva organización y asigna al usuario como OWNER.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createOrganizationSchema.parse(req.body);
      const organization = await organizationsService.createOrganization(
        validatedData,
        req.user!.id
      );

      sendSuccess(res, organization, 'Organización creada exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/organizations/:id
   * Obtiene la información detallada de una organización.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isPlatformAdmin = req.user!.role === 'ADMIN';
      const organization = await organizationsService.getOrganizationById(
        req.params.id,
        req.user!.id,
        isPlatformAdmin
      );

      sendSuccess(res, organization, 'Organización obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/organizations
   * Lista las organizaciones a las que pertenece el usuario (o todas si es admin con ?all=true).
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { all, status, orgType, locality, verificationStatus } = req.query;
      const isPlatformAdmin = req.user!.role === 'ADMIN';

      const filters = {
        status: status as any,
        orgType: orgType as any,
        locality: locality as string | undefined,
        verificationStatus: verificationStatus as any,
      };

      if (all === 'true' && isPlatformAdmin) {
        const organizations = await organizationsService.listAllOrganizations(filters);
        sendSuccess(res, organizations, 'Listado global de organizaciones');
        return;
      }

      const organizations = await organizationsService.listUserOrganizations(
        req.user!.id,
        filters
      );
      sendSuccess(res, organizations, 'Organizaciones del usuario obtenidas exitosamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/organizations/:id
   * Actualiza los datos de la organización.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = updateOrganizationSchema.parse(req.body);
      const organization = await organizationsService.updateOrganization(
        req.params.id,
        validatedData
      );

      sendSuccess(res, organization, 'Organización actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/organizations/:id
   * Desactiva lógicamente la organización.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organization = await organizationsService.deleteOrganization(req.params.id);
      sendSuccess(res, organization, 'Organización desactivada exitosamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/organizations/:id/members
   * Lista los miembros de una organización.
   */
  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await organizationsService.listMembers(req.params.id);
      sendSuccess(res, members, 'Miembros de la organización obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/organizations/:id/members
   * Vincula un nuevo miembro a la organización.
   */
  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = addMemberSchema.parse(req.body);
      const member = await organizationsService.addMember(
        req.params.id,
        validatedData,
        req.user!.id
      );

      sendSuccess(res, member, 'Miembro vinculado exitosamente a la organización', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/organizations/:id/members/:memberId
   * Actualiza el rol o estado de un miembro.
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = updateMemberRoleSchema.parse(req.body);
      const member = await organizationsService.updateMemberRole(
        req.params.id,
        req.params.memberId,
        validatedData
      );

      sendSuccess(res, member, 'Rol de miembro actualizado exitosamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/organizations/:id/members/:memberId
   * Desvincula un miembro de la organización.
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isPlatformAdmin = req.user!.role === 'ADMIN';
      const result = await organizationsService.removeMember(
        req.params.id,
        req.params.memberId,
        req.user!.id,
        isPlatformAdmin
      );

      sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/organizations/:id/verification
   * Radica solicitud de certificación o verificación ambiental/institucional.
   */
  async requestVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = requestVerificationSchema.parse(req.body);
      const organization = await organizationsService.requestVerification(
        req.params.id,
        validatedData
      );

      sendSuccess(
        res,
        organization,
        'Solicitud de verificación institucional radicada exitosamente'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/organizations/:id/verification/review
   * Dictamina y aprueba/rechaza una verificación (exclusivo administradores de plataforma).
   */
  async reviewVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = reviewVerificationSchema.parse(req.body);
      const organization = await organizationsService.reviewVerification(
        req.params.id,
        validatedData
      );

      sendSuccess(
        res,
        organization,
        `Verificación institucional dictaminada como ${validatedData.status}`
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/organizations/roles/available
   * Lista los roles del sistema y sus permisos configurados.
   */
  async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await organizationsService.listAvailableRoles();
      sendSuccess(res, roles, 'Roles y permisos disponibles');
    } catch (err) {
      next(err);
    }
  }
}

export const organizationsController = new OrganizationsController();
