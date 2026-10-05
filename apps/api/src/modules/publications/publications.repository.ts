import { prisma } from '../../database/prisma';
import { MaterialPublication } from '../../generated/prisma-client';
import {
  MaterialPublicationDto,
  CreatePublicationInput,
  UpdatePublicationInput,
  PublicationStatus,
} from '@data-circular/shared';

export function toPublicationDto(pub: any): MaterialPublicationDto {
  // Evaluación dinámica en tiempo de consulta de expiración (Lazy Expiration Check)
  const isExpired =
    pub.status === 'ACTIVE' &&
    pub.expiresAt &&
    new Date(pub.expiresAt) < new Date();

  const effectiveStatus = (isExpired ? 'EXPIRED' : pub.status) as PublicationStatus;

  return {
    id: pub.id,
    type: pub.type,
    ownerUserId: pub.ownerUserId,
    organizationId: pub.organizationId,
    categoryId: pub.categoryId,
    quantity: Number(pub.quantity),
    unitId: pub.unitId,
    locationAddress: pub.locationAddress,
    locationCity: pub.locationCity,
    locationArea: pub.locationArea,
    condition: pub.condition,
    photoUrl: pub.photoUrl,
    isUrgent: pub.isUrgent,
    status: effectiveStatus,
    expiresAt: pub.expiresAt ? pub.expiresAt.toISOString() : null,
    createdAt: pub.createdAt.toISOString(),
    updatedAt: pub.updatedAt.toISOString(),
    deletedAt: pub.deletedAt ? pub.deletedAt.toISOString() : null,
    ownerUser: pub.ownerUser
      ? {
          id: pub.ownerUser.id,
          fullName: pub.ownerUser.fullName,
          email: pub.ownerUser.email,
          phone: pub.ownerUser.phone,
        }
      : undefined,
    organization: pub.organization
      ? {
          id: pub.organization.id,
          name: pub.organization.name,
          legalName: pub.organization.legalName,
        }
      : null,
    category: pub.category
      ? {
          id: pub.category.id,
          name: pub.category.name,
          description: pub.category.description,
          parentId: pub.category.parentId,
          active: pub.category.active,
          createdAt: pub.category.createdAt.toISOString(),
          updatedAt: pub.category.updatedAt.toISOString(),
          parent: pub.category.parent
            ? {
                id: pub.category.parent.id,
                name: pub.category.parent.name,
              }
            : null,
        }
      : undefined,
    unit: pub.unit
      ? {
          id: pub.unit.id,
          name: pub.unit.name,
          abbreviation: pub.unit.abbreviation,
          active: pub.unit.active,
        }
      : undefined,
  };
}

export class PublicationsRepository {
  /**
   * Crea una nueva publicación de oferta o necesidad.
   * TODO (Almacenamiento definitivo): photoUrl almacena actualmente una URL o ruta local temporal.
   * Pendiente integrar con proveedor S3/GCS/MinIO/Cloudinary según sección 13 de Requerimientos.
   */
  async create(input: CreatePublicationInput, ownerUserId: string): Promise<MaterialPublicationDto> {
    const pub = await prisma.materialPublication.create({
      data: {
        type: input.type,
        ownerUserId,
        organizationId: input.organizationId || null,
        categoryId: input.categoryId,
        quantity: input.quantity,
        unitId: input.unitId,
        locationAddress: input.locationAddress.trim(),
        locationCity: input.locationCity || 'Bogotá D.C.',
        locationArea: input.locationArea || null,
        condition: input.condition || null,
        photoUrl: input.photoUrl || null,
        isUrgent: input.isUrgent || false,
        status: 'ACTIVE',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
    });

    return toPublicationDto(pub);
  }

  async findById(id: string, includeDeleted = false): Promise<MaterialPublicationDto | null> {
    const pub = await prisma.materialPublication.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
    });

    if (!pub) return null;

    // Si expiró, actualizar en BD para consistencia
    if (pub.status === 'ACTIVE' && pub.expiresAt && pub.expiresAt < new Date()) {
      await prisma.materialPublication.update({
        where: { id: pub.id },
        data: { status: 'EXPIRED' },
      }).catch(() => {});
      pub.status = 'EXPIRED';
    }

    return toPublicationDto(pub);
  }

  async update(id: string, input: UpdatePublicationInput): Promise<MaterialPublicationDto> {
    const pub = await prisma.materialPublication.update({
      where: { id },
      data: {
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.unitId ? { unitId: input.unitId } : {}),
        ...(input.locationAddress ? { locationAddress: input.locationAddress.trim() } : {}),
        ...(input.locationCity ? { locationCity: input.locationCity.trim() } : {}),
        ...(input.locationArea !== undefined ? { locationArea: input.locationArea || null } : {}),
        ...(input.condition !== undefined ? { condition: input.condition || null } : {}),
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl || null } : {}),
        ...(input.isUrgent !== undefined ? { isUrgent: input.isUrgent } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } : {}),
      },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
    });

    return toPublicationDto(pub);
  }

  async softDelete(id: string): Promise<MaterialPublicationDto> {
    const pub = await prisma.materialPublication.update({
      where: { id },
      data: {
        status: 'CLOSED',
        deletedAt: new Date(),
      },
      include: {
        ownerUser: true,
        organization: true,
        category: {
          include: { parent: true },
        },
        unit: true,
      },
    });

    return toPublicationDto(pub);
  }

  async listMine(userId: string, page = 1, limit = 20): Promise<{ data: MaterialPublicationDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [pubs, total] = await Promise.all([
      prisma.materialPublication.findMany({
        where: {
          ownerUserId: userId,
          deletedAt: null,
        },
        include: {
          ownerUser: true,
          organization: true,
          category: {
            include: { parent: true },
          },
          unit: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.materialPublication.count({
        where: {
          ownerUserId: userId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: pubs.map(toPublicationDto),
      total,
    };
  }

  async listAll(page = 1, limit = 20): Promise<{ data: MaterialPublicationDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [pubs, total] = await Promise.all([
      prisma.materialPublication.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          ownerUser: true,
          organization: true,
          category: {
            include: { parent: true },
          },
          unit: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.materialPublication.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: pubs.map(toPublicationDto),
      total,
    };
  }

  /**
   * Eliminación física permanente (exclusivo para pruebas automatizadas).
   */
  async deletePermanently(id: string): Promise<void> {
    await prisma.materialPublication.delete({
      where: { id },
    });
  }
}

export const publicationsRepository = new PublicationsRepository();
