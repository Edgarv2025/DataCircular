import { prisma } from '../../database/prisma';
import {
  Organization,
  OrganizationMember,
  Role,
  Permission,
  OrganizationStatus,
  VerificationStatus,
  MembershipStatus,
  OrganizationType,
  UserType,
} from '../../generated/prisma-client';
import {
  OrganizationDto,
  OrganizationMemberDto,
  RoleDto,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '@data-circular/shared';
import { seedSystemRolesAndPermissions } from './organizations.seed';

export function toOrganizationDto(
  org: Organization & { _count?: { members: number } },
  userRole?: string
): OrganizationDto {
  return {
    id: org.id,
    name: org.name,
    legalName: org.legalName,
    taxId: org.taxId,
    orgType: org.orgType as OrganizationDto['orgType'],
    activityType: org.activityType as OrganizationDto['activityType'],
    email: org.email,
    phone: org.phone,
    address: org.address,
    locality: org.locality,
    city: org.city,
    status: org.status as OrganizationDto['status'],
    verificationStatus: org.verificationStatus as OrganizationDto['verificationStatus'],
    verifiedAt: org.verifiedAt ? org.verifiedAt.toISOString() : null,
    verificationNotes: org.verificationNotes,
    certificateUrl: org.certificateUrl,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    deletedAt: org.deletedAt ? org.deletedAt.toISOString() : null,
    membersCount: org._count ? org._count.members : undefined,
    userRole,
  };
}

export function toMemberDto(
  member: OrganizationMember & {
    user: { id: string; fullName: string; email: string; phone: string | null };
    role: { id: string; name: string; description: string | null };
  }
): OrganizationMemberDto {
  return {
    id: member.id,
    organizationId: member.organizationId,
    userId: member.userId,
    roleId: member.roleId,
    status: member.status as OrganizationMemberDto['status'],
    joinedAt: member.joinedAt.toISOString(),
    user: {
      id: member.user.id,
      fullName: member.user.fullName,
      email: member.user.email,
      phone: member.user.phone,
    },
    role: {
      id: member.role.id,
      name: member.role.name,
      description: member.role.description,
    },
  };
}

export class OrganizationsRepository {
  /**
   * Garantiza que los roles y permisos del sistema existan.
   */
  async ensureSeeded(): Promise<void> {
    await seedSystemRolesAndPermissions();
  }

  /**
   * Busca un rol de sistema por su nombre ('OWNER', 'ADMIN', 'MEMBER', 'OPERATOR').
   */
  async findSystemRole(name: string): Promise<Role | null> {
    let role = await prisma.role.findFirst({
      where: {
        organizationId: null,
        name,
      },
    });

    if (!role) {
      await this.ensureSeeded();
      role = await prisma.role.findFirst({
        where: {
          organizationId: null,
          name,
        },
      });
    }

    return role;
  }

  /**
   * Lista todos los roles del sistema con sus respectivos permisos asignados.
   */
  async listSystemRoles(): Promise<RoleDto[]> {
    await this.ensureSeeded();
    const roles = await prisma.role.findMany({
      where: { isSystem: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
      })),
    }));
  }

  /**
   * Crea una nueva organización y asigna al usuario creador como OWNER en una transacción atómica.
   */
  async create(input: CreateOrganizationInput, creatorUserId: string): Promise<OrganizationDto> {
    const ownerRole = await this.findSystemRole('OWNER');
    if (!ownerRole) {
      throw new Error('Rol de sistema OWNER no encontrado');
    }

    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name.trim(),
          legalName: input.legalName ? input.legalName.trim() : null,
          taxId: input.taxId ? input.taxId.trim() : null,
          orgType: input.orgType as OrganizationType,
          activityType: input.activityType as UserType,
          email: input.email ? input.email.trim().toLowerCase() : null,
          phone: input.phone ? input.phone.trim() : null,
          address: input.address ? input.address.trim() : null,
          locality: input.locality || null,
          city: input.city || 'Bogotá D.C.',
          status: OrganizationStatus.ACTIVE,
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: creatorUserId,
          roleId: ownerRole.id,
          status: MembershipStatus.ACTIVE,
        },
      });

      return toOrganizationDto({ ...org, _count: { members: 1 } }, 'OWNER');
    });
  }

  /**
   * Busca una organización por ID.
   */
  async findById(id: string, includeDeleted = false): Promise<OrganizationDto | null> {
    const org = await prisma.organization.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return org ? toOrganizationDto(org) : null;
  }

  /**
   * Busca una organización por NIT (taxId).
   */
  async findByTaxId(taxId: string, excludeOrgId?: string): Promise<OrganizationDto | null> {
    const org = await prisma.organization.findFirst({
      where: {
        taxId: taxId.trim(),
        deletedAt: null,
        ...(excludeOrgId ? { id: { not: excludeOrgId } } : {}),
      },
    });

    return org ? toOrganizationDto(org) : null;
  }

  /**
   * Lista las organizaciones a las que pertenece un usuario.
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
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        organization: {
          deletedAt: null,
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.orgType ? { orgType: filters.orgType } : {}),
          ...(filters?.locality ? { locality: filters.locality } : {}),
          ...(filters?.verificationStatus ? { verificationStatus: filters.verificationStatus } : {}),
        },
      },
      include: {
        role: true,
        organization: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: {
        organization: { createdAt: 'desc' },
      },
    });

    return memberships.map((m) => toOrganizationDto(m.organization, m.role.name));
  }

  /**
   * Lista todas las organizaciones registradas (para administradores de plataforma).
   */
  async listAll(filters?: {
    status?: OrganizationStatus;
    orgType?: OrganizationType;
    locality?: string;
    verificationStatus?: VerificationStatus;
  }): Promise<OrganizationDto[]> {
    const orgs = await prisma.organization.findMany({
      where: {
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.orgType ? { orgType: filters.orgType } : {}),
        ...(filters?.locality ? { locality: filters.locality } : {}),
        ...(filters?.verificationStatus ? { verificationStatus: filters.verificationStatus } : {}),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((o) => toOrganizationDto(o));
  }

  /**
   * Actualiza los datos de una organización.
   */
  async update(id: string, input: UpdateOrganizationInput): Promise<OrganizationDto> {
    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.legalName !== undefined ? { legalName: input.legalName ? input.legalName.trim() : null } : {}),
        ...(input.taxId !== undefined ? { taxId: input.taxId ? input.taxId.trim() : null } : {}),
        ...(input.orgType ? { orgType: input.orgType as OrganizationType } : {}),
        ...(input.activityType ? { activityType: input.activityType as UserType } : {}),
        ...(input.email !== undefined ? { email: input.email ? input.email.trim().toLowerCase() : null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone ? input.phone.trim() : null } : {}),
        ...(input.address !== undefined ? { address: input.address ? input.address.trim() : null } : {}),
        ...(input.locality !== undefined ? { locality: input.locality || null } : {}),
        ...(input.city ? { city: input.city.trim() } : {}),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return toOrganizationDto(org);
  }

  /**
   * Desactivación lógica (soft delete) de la organización.
   */
  async softDelete(id: string): Promise<OrganizationDto> {
    const org = await prisma.organization.update({
      where: { id },
      data: {
        status: OrganizationStatus.INACTIVE,
        deletedAt: new Date(),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return toOrganizationDto(org);
  }

  /**
   * Busca la membresía de un usuario en una organización dada con rol y permisos asociados.
   */
  async findMember(organizationId: string, userId: string) {
    return prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Busca un miembro por su identificador de membresía (UUID).
   */
  async findMemberById(memberId: string) {
    return prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos los miembros de una organización.
   */
  async listMembers(organizationId: string): Promise<OrganizationMemberDto[]> {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map(toMemberDto);
  }

  /**
   * Añade un nuevo miembro a la organización.
   */
  async addMember(
    organizationId: string,
    userId: string,
    roleId: string,
    invitedById?: string
  ): Promise<OrganizationMemberDto> {
    const member = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        roleId,
        invitedById: invitedById || null,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return toMemberDto(member);
  }

  /**
   * Actualiza el rol y/o estado de un integrante de la organización.
   */
  async updateMember(
    memberId: string,
    data: { roleId?: string; status?: MembershipStatus }
  ): Promise<OrganizationMemberDto> {
    const member = await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        ...(data.roleId ? { roleId: data.roleId } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return toMemberDto(member);
  }

  /**
   * Desvincula / elimina la membresía de un usuario.
   */
  async removeMember(memberId: string): Promise<void> {
    await prisma.organizationMember.delete({
      where: { id: memberId },
    });
  }

  /**
   * Cuenta cuántos propietarios (OWNER) activos tiene la organización.
   */
  async countOwners(organizationId: string): Promise<number> {
    return prisma.organizationMember.count({
      where: {
        organizationId,
        status: MembershipStatus.ACTIVE,
        role: {
          name: 'OWNER',
        },
      },
    });
  }

  /**
   * Actualiza los datos y estado de verificación o certificación institucional.
   */
  async updateVerification(
    organizationId: string,
    data: {
      verificationStatus: VerificationStatus;
      verifiedAt?: Date | null;
      verificationNotes?: string | null;
      certificateUrl?: string | null;
    }
  ): Promise<OrganizationDto> {
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        verificationStatus: data.verificationStatus,
        ...(data.verifiedAt !== undefined ? { verifiedAt: data.verifiedAt } : {}),
        ...(data.verificationNotes !== undefined ? { verificationNotes: data.verificationNotes } : {}),
        ...(data.certificateUrl !== undefined ? { certificateUrl: data.certificateUrl } : {}),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return toOrganizationDto(org);
  }

  /**
   * Eliminación física permanente (exclusivo para limpieza en pruebas).
   */
  async deletePermanently(id: string): Promise<void> {
    await prisma.organization.delete({
      where: { id },
    });
  }
}

export const organizationsRepository = new OrganizationsRepository();
