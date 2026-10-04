import {
  OrganizationDto,
  OrganizationMemberDto,
  RoleDto,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddMemberInput,
  UpdateMemberRoleInput,
  RequestVerificationInput,
  ReviewVerificationInput,
  OrganizationStatus,
  OrganizationType,
  VerificationStatus,
} from '@data-circular/shared';
import { organizationsRepository } from './organizations.repository';
import { usersRepository } from '../users/users.repository';

export class OrganizationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'OrganizationError';
  }
}

export class OrganizationsService {
  /**
   * Crea una nueva organización empresarial o asociativa.
   * Asigna automáticamente al usuario creador el rol OWNER.
   */
  async createOrganization(
    input: CreateOrganizationInput,
    creatorUserId: string
  ): Promise<OrganizationDto> {
    if (input.taxId) {
      const existing = await organizationsRepository.findByTaxId(input.taxId);
      if (existing) {
        throw new OrganizationError(
          'TAX_ID_ALREADY_EXISTS',
          `Ya existe una organización registrada con el NIT ${input.taxId}`,
          409
        );
      }
    }

    return organizationsRepository.create(input, creatorUserId);
  }

  /**
   * Obtiene la información de una organización por su identificador.
   * Valida pertenencia activa o privilegios de administrador de plataforma.
   */
  async getOrganizationById(
    id: string,
    userId: string,
    isPlatformAdmin: boolean
  ): Promise<OrganizationDto> {
    const org = await organizationsRepository.findById(id);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    const membership = await organizationsRepository.findMember(id, userId);

    if (!isPlatformAdmin && (!membership || membership.status !== 'ACTIVE')) {
      throw new OrganizationError(
        'ORGANIZATION_ACCESS_DENIED',
        'No tienes acceso a esta organización',
        403
      );
    }

    return {
      ...org,
      userRole: membership?.role.name || (isPlatformAdmin ? 'PLATFORM_ADMIN' : undefined),
    };
  }

  /**
   * Lista las organizaciones donde el usuario es miembro activo.
   */
  async listUserOrganizations(
    userId: string,
    filters?: {
      status?: OrganizationStatus;
      orgType?: OrganizationType;
      locality?: string;
      verificationStatus?: VerificationStatus;
    }
  ): Promise<OrganizationDto[]> {
    return organizationsRepository.listUserOrganizations(userId, filters);
  }

  /**
   * Lista todas las organizaciones (exclusivo administradores de plataforma).
   */
  async listAllOrganizations(filters?: {
    status?: OrganizationStatus;
    orgType?: OrganizationType;
    locality?: string;
    verificationStatus?: VerificationStatus;
  }): Promise<OrganizationDto[]> {
    return organizationsRepository.listAll(filters);
  }

  /**
   * Actualiza los datos de la organización.
   */
  async updateOrganization(
    id: string,
    input: UpdateOrganizationInput
  ): Promise<OrganizationDto> {
    const org = await organizationsRepository.findById(id);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    if (input.taxId && input.taxId !== org.taxId) {
      const existing = await organizationsRepository.findByTaxId(input.taxId, id);
      if (existing) {
        throw new OrganizationError(
          'TAX_ID_ALREADY_EXISTS',
          `Ya existe otra organización con el NIT ${input.taxId}`,
          409
        );
      }
    }

    return organizationsRepository.update(id, input);
  }

  /**
   * Desactiva lógicamente una organización.
   */
  async deleteOrganization(id: string): Promise<OrganizationDto> {
    const org = await organizationsRepository.findById(id);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    return organizationsRepository.softDelete(id);
  }

  /**
   * Lista los integrantes de la organización.
   */
  async listMembers(organizationId: string): Promise<OrganizationMemberDto[]> {
    const org = await organizationsRepository.findById(organizationId);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    return organizationsRepository.listMembers(organizationId);
  }

  /**
   * Agrega o vincula a un usuario existente a la organización con un rol específico.
   */
  async addMember(
    organizationId: string,
    input: AddMemberInput,
    currentUserId: string
  ): Promise<OrganizationMemberDto> {
    const org = await organizationsRepository.findById(organizationId);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    // Verificar si el usuario existe en la plataforma
    const targetUser = await usersRepository.findSafeByEmail(input.email);
    if (!targetUser) {
      throw new OrganizationError(
        'USER_NOT_FOUND',
        `El usuario con correo ${input.email} no se encuentra registrado en DATA_CIRCULAR`,
        404
      );
    }

    // Verificar si ya pertenece a la organización
    const existingMembership = await organizationsRepository.findMember(
      organizationId,
      targetUser.id
    );

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        throw new OrganizationError(
          'MEMBER_ALREADY_EXISTS',
          'El usuario ya es miembro activo de esta organización',
          409
        );
      } else {
        // Reactivar membresía si estaba inactiva
        const targetRole = await organizationsRepository.findSystemRole(input.roleName);
        if (!targetRole) {
          throw new OrganizationError('INVALID_ROLE', `Rol ${input.roleName} no reconocido`, 400);
        }
        return organizationsRepository.updateMember(existingMembership.id, {
          roleId: targetRole.id,
          status: 'ACTIVE',
        });
      }
    }

    const role = await organizationsRepository.findSystemRole(input.roleName);
    if (!role) {
      throw new OrganizationError('INVALID_ROLE', `Rol ${input.roleName} no reconocido`, 400);
    }

    return organizationsRepository.addMember(
      organizationId,
      targetUser.id,
      role.id,
      currentUserId
    );
  }

  /**
   * Actualiza el rol o estado de un integrante.
   * Impide degradar o desactivar al único propietario (OWNER) de la organización.
   */
  async updateMemberRole(
    organizationId: string,
    memberId: string,
    input: UpdateMemberRoleInput
  ): Promise<OrganizationMemberDto> {
    const member = await organizationsRepository.findMemberById(memberId);
    if (!member || member.organizationId !== organizationId) {
      throw new OrganizationError('MEMBER_NOT_FOUND', 'Miembro no encontrado en la organización', 404);
    }

    const currentRoleName = member.role.name;
    const isOwner = currentRoleName === 'OWNER';
    const willStopBeingOwner = input.roleName !== 'OWNER' || (input.status && input.status !== 'ACTIVE');

    if (isOwner && willStopBeingOwner) {
      const ownerCount = await organizationsRepository.countOwners(organizationId);
      if (ownerCount <= 1) {
        throw new OrganizationError(
          'LAST_OWNER_CANNOT_BE_DEMOTED',
          'No es posible modificar ni desactivar al único propietario (OWNER) de la organización',
          400
        );
      }
    }

    const newRole = await organizationsRepository.findSystemRole(input.roleName);
    if (!newRole) {
      throw new OrganizationError('INVALID_ROLE', `Rol ${input.roleName} no reconocido`, 400);
    }

    return organizationsRepository.updateMember(memberId, {
      roleId: newRole.id,
      status: input.status,
    });
  }

  /**
   * Desvincula a un integrante de la organización.
   * Impide remover al único propietario (OWNER).
   */
  async removeMember(
    organizationId: string,
    memberId: string,
    currentUserId: string,
    isPlatformAdmin: boolean
  ): Promise<{ message: string }> {
    const member = await organizationsRepository.findMemberById(memberId);
    if (!member || member.organizationId !== organizationId) {
      throw new OrganizationError('MEMBER_NOT_FOUND', 'Miembro no encontrado en la organización', 404);
    }

    if (member.role.name === 'OWNER') {
      const ownerCount = await organizationsRepository.countOwners(organizationId);
      if (ownerCount <= 1) {
        throw new OrganizationError(
          'LAST_OWNER_CANNOT_BE_REMOVED',
          'No se puede remover al único propietario (OWNER) de la organización',
          400
        );
      }
    }

    await organizationsRepository.removeMember(memberId);

    return {
      message: 'Miembro desvinculado exitosamente de la organización',
    };
  }

  /**
   * Solicita verificación / certificación institucional para la organización.
   */
  async requestVerification(
    organizationId: string,
    input: RequestVerificationInput
  ): Promise<OrganizationDto> {
    const org = await organizationsRepository.findById(organizationId);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    if (org.verificationStatus === 'VERIFIED') {
      throw new OrganizationError(
        'ALREADY_VERIFIED',
        'La organización ya se encuentra verificada y certificada',
        400
      );
    }

    return organizationsRepository.updateVerification(organizationId, {
      verificationStatus: 'PENDING',
      verificationNotes: input.notes || 'Solicitud de verificación radicada por el usuario',
      certificateUrl: input.certificateUrl || null,
    });
  }

  /**
   * Dictamina y aprueba o rechaza una certificación institucional (exclusivo para administradores de plataforma).
   */
  async reviewVerification(
    organizationId: string,
    input: ReviewVerificationInput
  ): Promise<OrganizationDto> {
    const org = await organizationsRepository.findById(organizationId);
    if (!org) {
      throw new OrganizationError('ORGANIZATION_NOT_FOUND', 'Organización no encontrada', 404);
    }

    const isVerified = input.status === 'VERIFIED';

    return organizationsRepository.updateVerification(organizationId, {
      verificationStatus: input.status,
      verifiedAt: isVerified ? new Date() : null,
      verificationNotes: input.notes || (isVerified ? 'Verificación aprobada por administración' : 'Verificación rechazada'),
    });
  }

  /**
   * Lista los roles disponibles en el sistema y sus permisos asociados.
   */
  async listAvailableRoles(): Promise<RoleDto[]> {
    return organizationsRepository.listSystemRoles();
  }
}

export const organizationsService = new OrganizationsService();
