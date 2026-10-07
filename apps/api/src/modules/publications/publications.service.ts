import {
  MaterialPublicationDto,
  CreatePublicationInput,
  UpdatePublicationInput,
  SafeUserDto,
  SearchPublicationsQuery,
  PublicationSearchResultDto,
} from '@data-circular/shared';
import { publicationsRepository } from './publications.repository';
import { catalogRepository } from '../catalog/catalog.repository';
import { organizationsRepository } from '../organizations/organizations.repository';
import { matchesService } from '../matches/matches.service';

export class PublicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'PublicationError';
  }
}

export class PublicationsService {
  /**
   * Valida permisos para modificar o cerrar una publicación:
   * - El usuario creador (ownerUserId) tiene permiso directo.
   * - Si la publicación está asociada a una organización, un miembro con rol OWNER, ADMIN
   *   o permiso 'org:update' tiene autorización.
   * - Los administradores globales de la plataforma (UserRole === 'ADMIN') tienen bypass total.
   */
  private async assertCanModify(
    pub: MaterialPublicationDto,
    user: SafeUserDto
  ): Promise<void> {
    if (user.role === 'ADMIN') return;

    if (pub.ownerUserId === user.id) return;

    if (pub.organizationId) {
      const membership = await organizationsRepository.findMember(pub.organizationId, user.id);
      if (membership && membership.status === 'ACTIVE') {
        const roleName = membership.role.name;
        const permissions = membership.role.permissions.map((rp) => rp.permission.code);
        if (roleName === 'OWNER' || roleName === 'ADMIN' || permissions.includes('org:update')) {
          return;
        }
      }
    }

    throw new PublicationError(
      'FORBIDDEN',
      'No tienes autorización para modificar o cerrar esta publicación',
      403
    );
  }

  async createPublication(
    input: CreatePublicationInput,
    user: SafeUserDto
  ): Promise<MaterialPublicationDto> {
    // 1. Validar que la categoría exista y sea una subcategoría (parentId no nulo)
    const category = await catalogRepository.findCategoryById(input.categoryId);
    if (!category) {
      throw new PublicationError('CATEGORY_NOT_FOUND', 'Categoría de material no encontrada', 404);
    }

    if (!category.parentId) {
      throw new PublicationError(
        'INVALID_CATEGORY_LEVEL',
        'No se puede publicar directamente sobre una categoría principal. Debe seleccionar una subcategoría específica',
        400
      );
    }

    // 2. Validar que la unidad de medida exista
    const unit = await catalogRepository.findUnitById(input.unitId);
    if (!unit) {
      throw new PublicationError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada', 404);
    }

    // 3. Validar pertenencia si se publica a nombre de una organización
    if (input.organizationId) {
      const org = await organizationsRepository.findById(input.organizationId);
      if (!org || org.status !== 'ACTIVE') {
        throw new PublicationError(
          'ORGANIZATION_NOT_FOUND',
          'La organización especificada no existe o no está activa',
          404
        );
      }

      if (user.role !== 'ADMIN') {
        const membership = await organizationsRepository.findMember(input.organizationId, user.id);
        if (!membership || membership.status !== 'ACTIVE') {
          throw new PublicationError(
            'FORBIDDEN',
            'No perteneces a la organización bajo la cual intentas publicar',
            403
          );
        }
      }
    }

    return publicationsRepository.create(input, user.id);
  }

  async getPublicationById(id: string): Promise<MaterialPublicationDto> {
    const pub = await publicationsRepository.findById(id);
    if (!pub) {
      throw new PublicationError('PUBLICATION_NOT_FOUND', 'Publicación no encontrada', 404);
    }
    const compatibleCount = await matchesService.countMatchesForPublication(pub.id);
    return {
      ...pub,
      publicacionesCompatibles: compatibleCount,
    };
  }

  async updatePublication(
    id: string,
    input: UpdatePublicationInput,
    user: SafeUserDto
  ): Promise<MaterialPublicationDto> {
    const pub = await publicationsRepository.findById(id);
    if (!pub) {
      throw new PublicationError('PUBLICATION_NOT_FOUND', 'Publicación no encontrada', 404);
    }

    await this.assertCanModify(pub, user);

    if (input.unitId) {
      const unit = await catalogRepository.findUnitById(input.unitId);
      if (!unit) {
        throw new PublicationError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada', 404);
      }
    }

    return publicationsRepository.update(id, input);
  }

  async deletePublication(id: string, user: SafeUserDto): Promise<MaterialPublicationDto> {
    const pub = await publicationsRepository.findById(id);
    if (!pub) {
      throw new PublicationError('PUBLICATION_NOT_FOUND', 'Publicación no encontrada', 404);
    }

    await this.assertCanModify(pub, user);

    return publicationsRepository.softDelete(id);
  }

  async listMine(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: MaterialPublicationDto[]; total: number; page: number; limit: number }> {
    const parsedPage = Math.max(1, page);
    const parsedLimit = Math.min(100, Math.max(1, limit));
    const result = await publicationsRepository.listMine(userId, parsedPage, parsedLimit);
    return {
      ...result,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  async listAll(
    page = 1,
    limit = 20
  ): Promise<{ data: MaterialPublicationDto[]; total: number; page: number; limit: number }> {
    const parsedPage = Math.max(1, page);
    const parsedLimit = Math.min(100, Math.max(1, limit));
    const result = await publicationsRepository.listAll(parsedPage, parsedLimit);
    return {
      ...result,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  /**
   * Búsqueda general con filtros combinables y reglas de visibilidad (RF-10, CU-06).
   */
  async search(
    query: SearchPublicationsQuery,
    user: SafeUserDto
  ): Promise<PublicationSearchResultDto> {
    return publicationsRepository.search(query, user);
  }
}

export const publicationsService = new PublicationsService();
