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
   * El dueño administra su publicación; cualquier parte de una coincidencia puede
   * cambiar únicamente la solicitud de transporte.
   */
  private async assertCanModify(
    pub: MaterialPublicationDto,
    user: SafeUserDto,
    input?: UpdatePublicationInput
  ): Promise<void> {
    if (user.role !== 'USER') {
      throw new PublicationError(
        'FORBIDDEN',
        'Los administradores no pueden actuar como participantes de publicaciones',
        403
      );
    }

    if (input && Object.prototype.hasOwnProperty.call(input, 'requiresTransport')) {
      const isTransportToggleOnly =
        Object.keys(input).length === 1 &&
        Object.prototype.hasOwnProperty.call(input, 'requiresTransport');
      if (!isTransportToggleOnly) {
        throw new PublicationError(
          'FORBIDDEN',
          'La solicitud de transporte debe actualizarse por separado',
          403
        );
      }

      if (await matchesService.isMatchParticipantForPublication(pub.id, user.id)) return;
      throw new PublicationError(
        'TRANSPORT_REQUIRES_MATCH',
        'Solo las partes de una publicación con coincidencias pueden solicitar transporte',
        403
      );
    }

    if (pub.ownerUserId === user.id) {
      return;
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
    if (user.role !== 'USER') {
      throw new PublicationError(
        'FORBIDDEN',
        'Los administradores no pueden crear publicaciones',
        403
      );
    }
    if (user.userType !== 'GENERATOR' || input.type !== 'OFFER') {
      throw new PublicationError(
        'FORBIDDEN',
        'Solo los generadores pueden publicar ofertas de material; las demandas no están habilitadas',
        403
      );
    }
    if (input.requiresTransport) {
      throw new PublicationError(
        'TRANSPORT_REQUIRES_MATCH',
        'El transporte solo se puede solicitar después de encontrar una coincidencia',
        400
      );
    }

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

      const membership = await organizationsRepository.findMember(input.organizationId, user.id);
      if (!membership || membership.status !== 'ACTIVE') {
        throw new PublicationError(
          'FORBIDDEN',
          'No perteneces a la organización bajo la cual intentas publicar',
          403
        );
      }
    }

    return publicationsRepository.create(input, user.id);
  }

  async getPublicationById(id: string, user: SafeUserDto): Promise<MaterialPublicationDto> {
    const pub = await publicationsRepository.findById(id);
    if (!pub) {
      throw new PublicationError('PUBLICATION_NOT_FOUND', 'Publicación no encontrada', 404);
    }
    if (user.role !== 'USER') {
      throw new PublicationError('FORBIDDEN', 'Los administradores solo pueden acceder a funciones administrativas', 403);
    }

    const isOwner = pub.ownerUserId === user.id;
    const isPublicAndActive = pub.status === 'ACTIVE' && !pub.deletedAt &&
      (!pub.expiresAt || new Date(pub.expiresAt) > new Date());
    const canBrowse = user.userType !== 'GENERATOR';

    if (!isOwner && !(isPublicAndActive && canBrowse)) {
      throw new PublicationError('FORBIDDEN', 'No tienes acceso a esta publicación', 403);
    }
    const compatibleCount = await matchesService.countMatchesForPublication(pub.id);
    const isMatchParticipant = await matchesService.isMatchParticipantForPublication(pub.id, user.id);
    return {
      ...pub,
      publicacionesCompatibles: compatibleCount,
      isMatchParticipant,
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

    await this.assertCanModify(pub, user, input);

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
    if (user.role !== 'USER') {
      throw new PublicationError(
        'FORBIDDEN',
        'Los administradores no pueden consultar publicaciones como participantes',
        403
      );
    }
    if (query.type === 'NEED') {
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalPages: 0,
      };
    }
    return publicationsRepository.search(query, user);
  }
}

export const publicationsService = new PublicationsService();
